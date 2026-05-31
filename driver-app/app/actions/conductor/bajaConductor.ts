"use server";

import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function bajaConductor() {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  try {
    await prisma.conductor.update({
      where: { id_conductor: userId },
      data: {
        isActive: false,
        fecha_baja: new Date(),
        estado: "OFFLINE", // asegurarnos de que no quede online
      },
    });

    // Eliminar la cuenta completa en Clerk para que se borren sus credenciales de acceso
    const client = await clerkClient();
    await client.users.deleteUser(userId);

  } catch (error) {
    console.error("Error al dar de baja al conductor:", error);
    return { success: false, error: "Ocurrió un error al dar de baja tu cuenta." };
  }

  // Redirigir al inicio para que tenga que volver a elegir su rol o loguearse
  redirect("/");
}
