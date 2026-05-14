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
 * Lista de emails que tienen rol ADMIN.
 * En una arquitectura más robusta esto vendría de Clerk roles o de la BD.
 */
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());

/**
 * Obtiene la sesión del usuario actual y determina su rol.
 * Redirige automáticamente a /sign-in si no está autenticado.
 */
export async function getSessionData(): Promise<SessionData> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const userEmail = user?.emailAddresses[0]?.emailAddress ?? "";

  // ── Determinar rol ───────────────────────────────────────────────────
  if (ADMIN_EMAILS.includes(userEmail)) {
    return { userId, rol: "ADMIN", conductorData: null };
  }

  // Buscar conductor en la BD (PK = id de Clerk)
  const conductorData = await prisma.conductor.findUnique({
    where: { id_conductor: userId },
    include: { vehiculos: true },
  });

  if (conductorData) {
    return { userId, rol: "CONDUCTOR_ACTIVO", conductorData };
  }

  return { userId, rol: "CONDUCTOR_NUEVO", conductorData: null };
}
