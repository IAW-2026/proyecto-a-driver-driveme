"use server";

/**
 * app/admin/flota/actions.ts
 * Server Actions para la gestión de conductores del panel de administración.
 */
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

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
    if (isActive) {
      // Suspender conductor
      await prisma.conductor.update({
        where: { id_conductor },
        data: {
          isActive: false,
          fecha_baja: new Date(),
        },
      });
    } else {
      // Reactivar conductor
      await prisma.conductor.update({
        where: { id_conductor },
        data: {
          isActive: true,
          fecha_baja: null,
        },
      });
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
