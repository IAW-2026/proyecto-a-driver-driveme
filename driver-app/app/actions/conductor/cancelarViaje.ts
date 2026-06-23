"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function cancelarViajeAction(id_viaje: string): Promise<boolean> {
  try {
    // 1. Validar que hay un usuario logueado
    const { userId } = await auth();
    if (!userId) return false;

    // 2. Buscar el viaje
    const viaje = await prisma.viaje.findUnique({
      where: { id_viaje },
    });

    // 3. SEGURIDAD: Verificar que el viaje exista y que le pertenezca a ESTE conductor
    if (!viaje || viaje.id_conductor !== userId) {
      console.error("No autorizado a cancelar este viaje");
      return false;
    }

    if (viaje.estado_actual !== "EN_CURSO" && viaje.estado_actual !== "ACEPTADO") {
      return false;
    }

    // 4. Actualizar la BD de forma directa y segura
    await prisma.$transaction(async (tx) => {
      await tx.viaje.update({
        where: { id_viaje },
        data: { 
          estado_actual: "CANCELADO_POR_CONDUCTOR",
          estado: "CANCELADO_POR_CONDUCTOR" 
        },
      });

      await tx.conductor.update({
        where: { id_conductor: userId },
        data: { estado: "ONLINE" },
      });
    });

    return true;
  } catch (error) {
    console.error('Failed to cancel viaje', error);
    return false;
  }
}
