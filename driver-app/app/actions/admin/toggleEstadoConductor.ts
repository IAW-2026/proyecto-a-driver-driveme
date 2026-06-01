"use server";

/**
 * app/admin/flota/actions.ts
 * Server Actions para la gestión de conductores del panel de administración.
 */
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";

/**
 * Suspende o reactiva un conductor según su estado actual (isActive).
 *
 * - Suspender:   isActive = false, fecha_baja = ahora
 * - Reactivar:   isActive = true,  fecha_baja = null
 */
export async function toggleEstadoConductor(
  id_conductor: string,
  isActive: boolean
): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = await clerkClient();

    if (isActive) {
      // Suspender conductor
      
      // 1. Validar si tiene viajes activos
      const viajesActivos = await prisma.viaje.findMany({
        where: {
          id_conductor,
          estado_actual: { in: ["ACEPTADO", "EN_CURSO"] }
        }
      });
      if (viajesActivos.length > 0) {
        return { ok: false, error: "No se puede suspender al conductor porque tiene viajes en curso." };
      }

      // 2. Suspender conductor en Prisma
      await prisma.conductor.update({
        where: { id_conductor },
        data: {
          isActive: false,
          fecha_baja: new Date(),
          motivoBaja: "SUSPENSION_ADMIN",
          estado: "OFFLINE", // Forzar offline
          vehiculos: {
            updateMany: {
              where: { isActive: true },
              data: { isActive: false }
            }
          }
        },
      });

      // 3. Suspender en Clerk (Baneo a nivel de red)
      await client.users.banUser(id_conductor);

    } else {
      // Reactivar conductor
      await prisma.conductor.update({
        where: { id_conductor },
        data: {
          isActive: true,
          fecha_baja: null,
          motivoBaja: null,
          vehiculos: {
            updateMany: {
              where: { isActive: false },
              data: { isActive: true }
            }
          }
        },
      });

      // Reactivar en Clerk
      await client.users.unbanUser(id_conductor);
    }

    // Invalida la caché de la página de flota para que el Server Component
    // vuelva a consultar la BD y pase datos frescos al Client Component.
    revalidatePath("/admin/flota");
    return { ok: true };
  } catch (err) {
    console.error("[toggleEstadoConductor]", err);
    return { ok: false, error: "No se pudo actualizar el conductor." };
  }
}
