"use server";

// app/actions/conductor/buscarSolicitudes.ts

import { auth } from "@clerk/nextjs/server";
import { m2mHeaders } from "@/lib/m2m";
import { SolicitudViaje } from "@/app/types/viajes";

export type BuscarSolicitudesResult =
  | { success: true; solicitudes: SolicitudViaje[] }
  | { success: false; error: "UNAUTHORIZED" | "RIDER_APP_DOWN" };

export async function buscarSolicitudes(): Promise<BuscarSolicitudesResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "UNAUTHORIZED" };

  try {
    const baseUrl = process.env.RIDER_APP_URL;

    if (!baseUrl) {
      console.error("[buscarSolicitudes] RIDER_APP_URL no definida en el entorno.");
      return { success: false, error: "RIDER_APP_DOWN" };
    }

    const res = await fetch(
      `${baseUrl}/api/solicitudes?estado=BUSCANDO_CONDUCTOR`,
      {
        headers: m2mHeaders(),
        cache: "no-store",
      }
    );

    if (!res.ok) {
      console.warn(`[buscarSolicitudes] Rider App devolvió ${res.status}`);
      return { success: false, error: "RIDER_APP_DOWN" };
    }

    const data = await res.json();
    // La Rider App devuelve la lista dentro de "data" (data.data) y la paginación en "pagination"
    const solicitudes: SolicitudViaje[] = Array.isArray(data.data)
      ? data.data
      : [];

    return { success: true, solicitudes };
  } catch (e) {
    console.error("[buscarSolicitudes] Rider App inalcanzable:", e);
    return { success: false, error: "RIDER_APP_DOWN" };
  }
}