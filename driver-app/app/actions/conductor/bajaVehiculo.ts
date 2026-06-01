"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function bajaVehiculo(idVehiculo: string) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "No autorizado" };
  }

  try {
    const vehiculo = await prisma.vehiculo.findUnique({
      where: { id_vehiculo: idVehiculo },
    });

    if (!vehiculo) {
      return { success: false, error: "Vehículo no encontrado." };
    }

    if (vehiculo.id_conductor !== userId) {
      return { success: false, error: "No tienes permiso para dar de baja este vehículo." };
    }

    await prisma.vehiculo.update({
      where: { id_vehiculo: idVehiculo },
      data: {
        isActive: false,
        fecha_baja: new Date(),
      },
    });

    revalidatePath("/perfil");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Ocurrió un error inesperado al intentar dar de baja el vehículo." };
  }
}
