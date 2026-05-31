/**
 * lib/getSessionData.ts
 * -----------------------------------------------------------------------
 * Helper server-side reutilizable.
 * Centraliza: autenticación Clerk + determinación de rol + datos del conductor.
 * Uso: importar en cualquier Server Component o Route Handler.
 * -----------------------------------------------------------------------
 */
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";

export type Rol = "ADMIN" | "CONDUCTOR_NUEVO" | "CONDUCTOR_ACTIVO";

export type ConductorConVehiculos = Prisma.ConductorGetPayload<{
  include: { vehiculos: true };
}>;

export interface SessionData {
  userId: string;
  rol: Rol;
  conductorData: ConductorConVehiculos | null;
}

/**
 * Obtiene la sesión del usuario actual y determina su rol.
 * Redirige automáticamente a /sign-in si no está autenticado.
 */
export async function getSessionData(): Promise<SessionData> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  let user;
  try {
    user = await currentUser();
  } catch (error) {
    // Si la sesión existe pero el usuario fue eliminado de Clerk (ej: hard delete)
    redirect("/sign-in");
  }
  if (!user) redirect("/sign-in");
  const clerkRole = String(user?.publicMetadata?.role ?? "").toLowerCase();

  if (clerkRole === "admin") {
    return { userId, rol: "ADMIN", conductorData: null };
  }

  const conductorData = await prisma.conductor.findUnique({
    where: { id_conductor: userId },
    include: { vehiculos: true },
  });

  if (clerkRole === "driver") {
    if (conductorData) {
      return { userId, rol: "CONDUCTOR_ACTIVO", conductorData };
    }

    return { userId, rol: "CONDUCTOR_NUEVO", conductorData: null };
  }

  return { userId, rol: "CONDUCTOR_NUEVO", conductorData: null };
}
