"use server";

import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function reactivarConductor(licencia: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  try {
    // Buscar al conductor inactivo
    const conductorInactivo = await prisma.conductor.findUnique({
      where: { licencia }
    });

    if (!conductorInactivo || conductorInactivo.isActive) {
      return { success: false, error: "No se encontró una cuenta inactiva para reactivar." };
    }

    const oldUserId = conductorInactivo.id_conductor;

    // Actualizar el id_conductor, usando onUpdate: Cascade para actualizar relaciones
    // Nota: Prisma no permite actualizar fácilmente un @id si hay dependencias complejas,
    // pero como agregamos onUpdate: Cascade, podemos intentarlo o usar raw SQL.
    // Para asegurar el cascade en PostgreSQL usamos una query en raw SQL ya que
    // Prisma client a veces bloquea la modificación de campos @id que tienen relaciones.

    await prisma.$executeRawUnsafe(`
      UPDATE "Conductor" 
      SET id_conductor = $1, "isActive" = true, fecha_baja = null 
      WHERE id_conductor = $2
    `, userId, oldUserId);

    // Si también se usa el user id de Clerk en otras tablas de forma independiente (ej Vehiculo no tiene PK pero sí FK id_conductor)
    // El onUpdate: CASCADE lo hace automáticamente.

    // Actualizar metadata de Clerk
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role: "driver" },
    });

  } catch (error) {
    console.error("Error al reactivar el conductor:", error);
    return { success: false, error: "Ocurrió un error al intentar reactivar tu cuenta." };
  }

  redirect("/");
}
