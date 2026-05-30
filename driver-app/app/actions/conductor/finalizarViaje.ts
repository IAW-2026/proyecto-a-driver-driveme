"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth} from "@clerk/nextjs/server";
import { m2mHeaders } from "@/lib/m2m";
import { revalidateTag } from 'next/cache';

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
      const pagoRes = await fetch(`${process.env.PAYMENTS_APP_URL}/api/pagos/transacciones`, {
        method: "PUT",
        headers: m2mHeaders(),
        body: JSON.stringify({
          id_transaccion: id_viaje,
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
    revalidateTag(`sugerencias-${userId}`, "default");
    return { success: true, id_transaccion: idTransaccion, precio_final: viaje.precio_final };
  } catch (error) {
    console.error("Error al finalizar viaje:", error);
    return { success: false, error: String(error) };
  }
}