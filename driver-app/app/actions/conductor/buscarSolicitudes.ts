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

  // --- INICIO MOCK ---
  // Cambiar a false para usar la conexión real con la Rider App
  const useMock = true; 
  if (useMock) {
    const randomSuffix = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const mockSolicitudes: SolicitudViaje[] = [
      {
        id_solicitud: `mock-1-${randomSuffix}`,
        precio_estimado: 1200.5,
        eta_min: 4,
        distancia_km: 3.2,
        pasajero: {
          id_pasajero: "usr_mock_123",
          nombre: "Victoria (Mock)",
        },
        origen: {
          direccion: "Av. Cabildo 1500",
          latitud: -34.5678,
          longitud: -58.4567,
        },
        destino: {
          direccion: "Plaza Italia",
          latitud: -34.5804,
          longitud: -58.4208,
        },
      },
      {
        id_solicitud: `mock-2-${randomSuffix}`,
        precio_estimado: 850.0,
        eta_min: 8,
        distancia_km: 1.5,
        pasajero: {
          id_pasajero: "usr_mock_456",
          nombre: "Juan (Mock)",
        },
        origen: {
          direccion: "Av. Santa Fe 3200",
          latitud: -34.5891,
          longitud: -58.4116,
        },
        destino: {
          direccion: "Alto Palermo",
          latitud: -34.5881,
          longitud: -58.4093,
        },
      }
    ];
    return { success: true, solicitudes: mockSolicitudes };
  }
  // --- FIN MOCK ---

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