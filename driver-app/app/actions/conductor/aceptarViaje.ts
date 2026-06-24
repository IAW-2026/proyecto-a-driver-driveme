"use server";

// app/actions/aceptarViaje.ts

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma, TransactionClient } from "@/lib/prisma";
import { m2mHeaders } from "@/lib/m2m";
import { z } from "zod";

const aceptarViajeSchema = z.object({
  id_solicitud:      z.string(),
  id_conductor:      z.string(),
  id_pasajero:       z.string(),
  id_vehiculo:       z.string(),
  latitud_actual:    z.coerce.number(),
  longitud_actual:   z.coerce.number(),
  metodo_pago:       z.enum(["EFECTIVO", "MERCADO_PAGO"]),
  precio_estimado:   z.coerce.number(),
  origen_latitud:    z.coerce.number().optional(),
  origen_longitud:   z.coerce.number().optional(),
  origen_direccion:  z.string().optional(),
  destino_latitud:   z.coerce.number().optional(),
  destino_longitud:  z.coerce.number().optional(),
  destino_direccion: z.string().optional(),
  pasajero_nombre:   z.string().optional(),
});

export type AceptarViajePayload = z.input<typeof aceptarViajeSchema>;

export type AceptarViajeResult =
  | { error: "UNAUTHORIZED" }
  | { error: "FORBIDDEN_CONDUCTOR" }
  | { error: "CONDUCTOR_INACTIVO" }
  | { error: "VALIDACION"; detalle: string }
  | { error: "CONFLICTO" }           
  | { error: "RIDER_APP_DOWN" }      
  | { error: "DESCONOCIDO" };

export async function aceptarViaje(
  payload: AceptarViajePayload
): Promise<AceptarViajeResult> {

  // 1. Autenticación (Clerk)
  const { userId } = await auth();
  if (!userId) return { error: "UNAUTHORIZED" };

  // 2. Validación del payload con Zod
  const parsed = aceptarViajeSchema.safeParse(payload);
  if (!parsed.success) {
    console.error("[aceptarViaje] Error de validación Zod:", parsed.error);
    return { error: "VALIDACION", detalle: parsed.error.message };
  }

  const data = parsed.data;

  // 3. El conductor autenticado debe ser quien acepta el viaje
  if (data.id_conductor !== userId) {
    return { error: "FORBIDDEN_CONDUCTOR" };
  }

  // 4. Verificar que existe como conductor activo
  const conductorExiste = await prisma.conductor.findUnique({
    where:  { id_conductor: userId },
    select: { id_conductor: true, isActive: true, estado: true },
  });

  if (!conductorExiste || !conductorExiste.isActive) {
    return { error: "CONDUCTOR_INACTIVO" };
  }

  const estadoOriginalConductor = conductorExiste.estado;

  // 4.5. Prevenir error de Unique constraint (doble clic)
  const viajeExistente = await prisma.viaje.findUnique({
    where: { id_solicitud: data.id_solicitud }
  });

  if (viajeExistente) {
    if (viajeExistente.id_conductor === data.id_conductor) {
      // Si el conductor hizo doble clic, simplemente lo redirigimos al viaje que ya creó
      redirect(`/viaje/${viajeExistente.id_viaje}`);
    } else {
      // Si otro conductor se le adelantó un milisegundo antes
      return { error: "CONFLICTO" };
    }
  }

  // 5. Transacción local — idéntica al route.ts
  const viaje = await prisma.$transaction(async (tx: TransactionClient) => {
    const v = await tx.viaje.create({
      data: {
        id_solicitud:      data.id_solicitud,
        id_conductor:      data.id_conductor,
        id_pasajero:       data.id_pasajero,
        id_vehiculo:       data.id_vehiculo,
        estado_actual:     "ACEPTADO",
        metodo_pago:       data.metodo_pago,
        precio:            data.precio_estimado,
        precio_final:      data.precio_estimado,
        origen_latitud:    data.origen_latitud,
        origen_longitud:   data.origen_longitud,
        origen_direccion:  data.origen_direccion,
        destino_latitud:   data.destino_latitud,
        destino_longitud:  data.destino_longitud,
        destino_direccion: data.destino_direccion,
        pasajero_nombre:   data.pasajero_nombre,
      },
    });

    await tx.conductor.update({
      where: { id_conductor: data.id_conductor },
      data: {
        estado:          "OCUPADO",
        latitud_actual:  data.latitud_actual,
        longitud_actual: data.longitud_actual,
      },
    });

    return v;
  });

  // 6. Sincronización M2M → Rider App (idéntica al route.ts)

  try {
    const riderResponse = await fetch(`${process.env.RIDER_APP_URL}/api/viajes`, {
      method:  "POST",
      headers: m2mHeaders(),
      body: JSON.stringify({
        id_solicitud:    viaje.id_solicitud,
        id_conductor:    viaje.id_conductor,
        id_vehiculo:     viaje.id_vehiculo,
        latitud_actual:  data.latitud_actual,
        longitud_actual: data.longitud_actual,
      }),
    });

    // 409 → otro conductor se adelantó: compensar y avisar al cliente
    if (riderResponse.status === 409) {
      console.warn(
        `[CONFLICT] Solicitud ${data.id_solicitud} ya tomada. Revirtiendo...`
      );

      await prisma.$transaction(async (tx) => {
        await tx.viaje.delete({ where: { id_viaje: viaje.id_viaje } });
        await tx.conductor.update({
          where: { id_conductor: data.id_conductor },
          data:  { estado: estadoOriginalConductor },
        });
      });

      return { error: "CONFLICTO" };
    }

    if (!riderResponse.ok) {
      console.warn(
        `[WARNING] Rider App devolvió ${riderResponse.status} para el viaje ${viaje.id_viaje}.`
      );
      return { error: "RIDER_APP_DOWN" };
    }
  } catch (e) {
    console.warn("[WARNING] Rider App inalcanzable. Viaje local guardado.", e);
    return { error: "RIDER_APP_DOWN" };
  }

  redirect(`/viaje/${viaje.id_viaje}`);
}