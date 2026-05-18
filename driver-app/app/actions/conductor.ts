// app/actions/conductor.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// ── Helper: cabeceras M2M ────────────────────────────────────────────────────
// Centraliza la construcción del header x-api-key para todas las llamadas
// salientes M2M (Rider App, Payments App, Feedback App).
// Si INTERNAL_API_KEY no está definida, lo loguea como error crítico y
// devuelve solo Content-Type para que la request no falle silenciosamente.
function m2mHeaders(): HeadersInit {
  const key = process.env.INTERNAL_API_KEY;
  if (!key) {
    console.error(
      "[ERROR] INTERNAL_API_KEY no definida. Las llamadas M2M serán rechazadas por los otros servicios."
    );
  }
  return {
    "Content-Type": "application/json",
    ...(key ? { "x-api-key": key } : {}),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Acción 1: Cambiar estado del switch Online/Offline
// ────────────────────────────────────────────────────────────────────────────
export async function toggleConductorStatus(conductorId: string, nuevoEstado: boolean) {
  try {
    const estadoStr = nuevoEstado ? "ONLINE" : "OFFLINE";

    await prisma.conductor.update({
      where: { id_conductor: conductorId },
      data: { estado: estadoStr },
    });

    await prisma.historialConexion.create({
      data: {
        id_conductor: conductorId,
        estado: estadoStr,
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar estado del conductor:", error);
    return { success: false, error: String(error) };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Acción 2: Registrar nuevo conductor
// ────────────────────────────────────────────────────────────────────────────
export async function registrarConductor(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  await prisma.conductor.create({
    data: {
      id_conductor: userId,
      nombre: formData.get("nombre") as string,
      apellido: formData.get("apellido") as string,
      licencia: formData.get("licencia") as string,
      vehiculos: {
        create: {
          patente: (formData.get("patente") as string).toUpperCase(),
          marca: formData.get("marca") as string,
          modelo: formData.get("modelo") as string,
          anio: parseInt(formData.get("anio") as string, 10),
          color: String(formData.get("color") ?? "No especificado"),
        },
      },
    },
  });

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { role: "driver" },
  });

  redirect("/");
}

// ────────────────────────────────────────────────────────────────────────────
// Acción 3: Iniciar viaje (ACEPTADO → EN_CURSO)
// ────────────────────────────────────────────────────────────────────────────
export async function iniciarViaje(id_viaje: string) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "No autorizado" };

  try {
    const viaje = await prisma.viaje.findUnique({ where: { id_viaje } });
    if (!viaje) return { success: false, error: "Viaje no encontrado" };
    if (viaje.id_conductor !== userId) return { success: false, error: "No sos el conductor de este viaje" };

    await prisma.viaje.update({
      where: { id_viaje },
      data: {
        estado_actual: "EN_CURSO",
        tiempo_comienzo: new Date(),
      },
    });

    // Notificar a Rider App — M2M requerido por el contrato
    try {
      await fetch(
        `${process.env.RIDER_APP_URL}/api/notificaciones/viajes/${id_viaje}/estado`,
        {
          method: "POST",
          headers: m2mHeaders(),
          body: JSON.stringify({
            id_viaje,
            id_pasajero: viaje.id_pasajero,
            estado_actual: "EN_CURSO",
            fuente: "DRIVER_APP",
          }),
        }
      );
    } catch {
      console.warn("[WARNING] No se pudo notificar a Rider App del inicio del viaje.");
    }

    revalidatePath(`/viaje/${id_viaje}`);
    return { success: true };
  } catch (error) {
    console.error("Error al iniciar viaje:", error);
    return { success: false, error: String(error) };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Acción 4: Finalizar viaje (EN_CURSO → FINALIZADO)
// ────────────────────────────────────────────────────────────────────────────
export async function finalizarViaje(id_viaje: string) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "No autorizado" };

  try {
    const viaje = await prisma.viaje.findUnique({ where: { id_viaje } });
    if (!viaje) return { success: false, error: "Viaje no encontrado" };
    if (viaje.id_conductor !== userId) return { success: false, error: "No sos el conductor de este viaje" };
    if (viaje.estado_actual === "FINALIZADO") return { success: false, error: "El viaje ya fue finalizado" };

    // 1. Marcar FINALIZADO en la BD local
    await prisma.viaje.update({
      where: { id_viaje },
      data: {
        estado_actual: "FINALIZADO",
        tiempo_completado: new Date(),
      },
    });

    // 2. Liberar al conductor → ONLINE
    await prisma.conductor.update({
      where: { id_conductor: userId },
      data: { estado: "ONLINE" },
    });

    // 3. Registrar el pase automático a ONLINE en el historial
    await prisma.historialConexion.create({
      data: {
        id_conductor: userId,
        estado: "ONLINE",
      },
    });

    // 4. Procesar cobro via Payments App — M2M requerido por el contrato
    let idTransaccion: string | null = null;
    try {
      const pagoRes = await fetch(`${process.env.PAYMENTS_APP_URL}/api/pagos/procesar`, {
        method: "POST",
        headers: m2mHeaders(),
        body: JSON.stringify({
          id_viaje,
          id_pasajero: viaje.id_pasajero,
          monto: viaje.precio_final,
          tipo: viaje.metodo_pago,
        }),
      });
      const pagoData = await pagoRes.json();
      idTransaccion = pagoData.id_transaccion ?? null;
    } catch {
      console.warn("[WARNING] Payments App inalcanzable.");
    }

    // 5. Notificar a Rider App — M2M requerido por el contrato
    try {
      await fetch(
        `${process.env.RIDER_APP_URL}/api/notificaciones/viajes/${id_viaje}/estado`,
        {
          method: "POST",
          headers: m2mHeaders(),
          body: JSON.stringify({
            id_viaje,
            id_pasajero: viaje.id_pasajero,
            estado_actual: "FINALIZADO",
            fuente: "DRIVER_APP",
          }),
        }
      );
    } catch {
      console.warn("[WARNING] Rider App inalcanzable al notificar finalización.");
    }

    revalidatePath("/");
    return { success: true, id_transaccion: idTransaccion, precio_final: viaje.precio_final };
  } catch (error) {
    console.error("Error al finalizar viaje:", error);
    return { success: false, error: String(error) };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Acción 5: Actualizar Meta Diaria
// ────────────────────────────────────────────────────────────────────────────
export async function actualizarMetaDiaria(conductorId: string, nuevaMeta: number) {
  try {
    if (nuevaMeta < 1000) return { success: false, error: "La meta debe ser al menos $1.000" };

    await prisma.conductor.update({
      where: { id_conductor: conductorId },
      data: { meta_diaria: nuevaMeta },
    });

    revalidatePath("/perfil");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Error al actualizar la meta:", error);
    return { success: false, error: "Hubo un error al guardar tu meta." };
  }
}