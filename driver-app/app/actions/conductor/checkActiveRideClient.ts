"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { EstadoViaje } from "@/app/generated/prisma/client";

export async function checkActiveRideClient() {
  const { userId } = await auth();
  if (!userId) return { activeViajeId: null };

  const conductor = await prisma.conductor.findUnique({
    where: { id_conductor: userId },
    select: { estado: true }
  });

  if (conductor?.estado === "OCUPADO") {
    const activeViaje = await prisma.viaje.findFirst({
      where: {
        id_conductor: userId,
        estado_actual: { in: [EstadoViaje.ACEPTADO, EstadoViaje.EN_CURSO] }
      }
    });
    
    if (activeViaje) {
      return { activeViajeId: activeViaje.id_viaje };
    }
  }

  return { activeViajeId: null };
}
