// app/actions/conductor.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// Acción 1: Cambiar estado del switch
export async function toggleConductorStatus(conductorId: string, nuevoEstado: boolean) {
  try {
    await prisma.conductor.update({
      where: { id_conductor: conductorId },
      data: { disponible: nuevoEstado },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    return { success: false };
  }
}

// Acción 2: Registrar nuevo conductor (Movido desde page.tsx)
export async function registrarConductor(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  // 1. Guardamos todo en Prisma
  await prisma.conductor.create({
    data: {
      id_conductor: userId,
      nombre: formData.get("nombre") as string,
      apellido: formData.get("apellido") as string,
      licencia: formData.get("licencia") as string,
      vehiculos: {
        create: {
          patente: formData.get("patente") as string,
          marca: formData.get("marca") as string,
          modelo: formData.get("modelo") as string,
          anio: parseInt(formData.get("anio") as string, 10),
        }
      }
    }
  });

  // 2. Actualizamos la metadata en Clerk para tener el rol guardado
  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { role: "conductor" },
  });

  // 3. Recargamos la vista principal
  redirect("/");
}