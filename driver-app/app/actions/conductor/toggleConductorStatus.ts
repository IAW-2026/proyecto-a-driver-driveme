"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

export async function toggleConductorStatus(conductorId: string, nuevoEstado: boolean) {
  const { userId } = await auth();
  if (!userId || userId !== conductorId) return { success: false, error: "No autorizado" };

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