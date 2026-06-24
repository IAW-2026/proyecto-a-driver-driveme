"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { m2mHeaders } from "@/lib/m2m"

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