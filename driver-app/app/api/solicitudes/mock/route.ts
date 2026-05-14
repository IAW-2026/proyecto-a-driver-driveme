/**
 * app/api/solicitudes/mock/route.ts
 * -----------------------------------------------------------------------
 * Endpoint de simulación para el flujo de aceptación de viaje.
 * En producción, el PanelConductor pollearía la Rider App directamente.
 * Este mock devuelve una solicitud aleatoria 1 de cada 3 llamadas,
 * para simular que llega una solicitud mientras el conductor espera.
 * -----------------------------------------------------------------------
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const ORIGENES = [
  { direccion: "Plaza Rivadavia, Bahía Blanca", latitud: -38.7183, longitud: -62.2663 },
  { direccion: "Teatro Municipal, Bahía Blanca", latitud: -38.7153, longitud: -62.2655 },
  { direccion: "Parque de Mayo, Bahía Blanca", latitud: -38.7050, longitud: -62.2675 },
  { direccion: "Terminal de Ómnibus, Bahía Blanca", latitud: -38.7167, longitud: -62.2583 },
];

const DESTINOS = [
  { direccion: "Hospital Penna, Bahía Blanca", latitud: -38.7118, longitud: -62.2335 },
  { direccion: "Universidad Nacional del Sur", latitud: -38.7060, longitud: -62.2714 },
  { direccion: "Bahía Blanca Plaza Shopping", latitud: -38.6975, longitud: -62.2472 },
  { direccion: "Paseo de las Esculturas, Bahía Blanca", latitud: -38.7111, longitud: -62.2594 },
];

const PASAJEROS = [
  { id_pasajero: "pas_001", nombre: "Martina González" },
  { id_pasajero: "pas_002", nombre: "Lucas Pérez" },
  { id_pasajero: "pas_003", nombre: "Sofía Ramírez" },
  { id_pasajero: "pas_004", nombre: "Diego Fernández" },
];

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Simula que llega una solicitud con 40% de probabilidad en cada polling
  const hayNuevaSolicitud = Math.random() < 0.4;

  if (!hayNuevaSolicitud) {
    return NextResponse.json({ solicitud: null });
  }

  const origen = ORIGENES[Math.floor(Math.random() * ORIGENES.length)];
  const destino = DESTINOS[Math.floor(Math.random() * DESTINOS.length)];
  const pasajero = PASAJEROS[Math.floor(Math.random() * PASAJEROS.length)];

  // Distancia y precio estimados (mock)
  const distancia_km = parseFloat((Math.random() * 12 + 1.5).toFixed(1));
  const precio_estimado = Math.round(distancia_km * 850); // ~$850/km
  const eta_min = Math.round(distancia_km * 2.5);

  const solicitud = {
    id_solicitud: `sol_mock_${Date.now()}`,
    precio_estimado,
    eta_min,
    distancia_km,
    pasajero,
    origen,
    destino,
  };

  return NextResponse.json({ solicitud });
}
