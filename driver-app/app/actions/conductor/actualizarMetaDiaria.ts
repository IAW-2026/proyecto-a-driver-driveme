"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

export async function actualizarMetaDiaria(conductorId: string, nuevaMeta: number) {
  const { userId } = await auth();
  if (!userId || userId !== conductorId) return { success: false, error: "No autorizado" };

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