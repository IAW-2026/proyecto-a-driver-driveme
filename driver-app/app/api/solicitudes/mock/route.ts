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
  { direccion: "Plaza Rivadavia, Bahía Blanca", latitud: -38.71762, longitud: -62.26549 },
  { direccion: "Teatro Municipal, Bahía Blanca", latitud: -38.71495, longitud: -62.26017 }, // Alsina 425
  { direccion: "Parque de Mayo, Bahía Blanca", latitud: -38.69541, longitud: -62.27216 },
  { direccion: "Terminal de Ómnibus, Bahía Blanca", latitud: -38.73604, longitud: -62.24702 }, // Drago 1900
];

const DESTINOS = [
  { direccion: "Hospital Penna, Bahía Blanca", latitud: -38.72969, longitud: -62.22772 }, // Av. Láinez 2401
  { direccion: "Universidad Nacional del Sur", latitud: -38.70173, longitud: -62.27020 }, // Complejo Alem 1253
  { direccion: "Bahía Blanca Plaza Shopping", latitud: -38.69997, longitud: -62.24168 }, // Sarmiento 2153
  { direccion: "Paseo de las Esculturas, Bahía Blanca", latitud: -38.70553, longitud: -62.26127 }, // Urquiza 574
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