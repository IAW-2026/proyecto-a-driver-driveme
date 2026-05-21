/**
 * app/api/mocks/rider/api/solicitudes/route.ts
 * -----------------------------------------------------------------------
 * Endpoint de simulación para el flujo de aceptación de viaje.
 * -----------------------------------------------------------------------
 */
import { NextResponse } from "next/server";
const ORIGENES = [
  { direccion: "Plaza Rivadavia, Bahía Blanca", latitud: -38.71762, longitud: -62.26549 },
  { direccion: "Teatro Municipal, Bahía Blanca", latitud: -38.71495, longitud: -62.26017 },
  { direccion: "Parque de Mayo, Bahía Blanca", latitud: -38.69541, longitud: -62.27216 },
  { direccion: "Terminal de Ómnibus, Bahía Blanca", latitud: -38.73604, longitud: -62.24702 },
];

const DESTINOS = [
  { direccion: "Hospital Penna, Bahía Blanca", latitud: -38.72969, longitud: -62.22772 },
  { direccion: "Universidad Nacional del Sur", latitud: -38.70173, longitud: -62.27020 },
  { direccion: "Bahía Blanca Plaza Shopping", latitud: -38.69997, longitud: -62.24168 },
  { direccion: "Paseo de las Esculturas, Bahía Blanca", latitud: -38.70553, longitud: -62.26127 },
];

const PASAJEROS = [
  { id_pasajero: "pas_001", nombre: "Martina González" },
  { id_pasajero: "pas_002", nombre: "Lucas Pérez" },
  { id_pasajero: "pas_003", nombre: "Sofía Ramírez" },
  { id_pasajero: "pas_004", nombre: "Diego Fernández" },
];

export async function GET(request: Request) {
  // Bloqueo de seguridad: No exponer mocks en producción
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  // REEMPLAZO DE CLERK POR VALIDACIÓN M2M (Contrato 03-apis.md)
  const apiKey = request.headers.get('x-api-key');
  const expectedKey = process.env.INTERNAL_API_KEY;

  // Validamos la API Key si está configurada en el .env
  if (expectedKey && apiKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized M2M access" }, { status: 401 });
  }

  // Simula que llega una solicitud con 40% de probabilidad en cada polling
  const hayNuevaSolicitud = Math.random() < 0.4;

  if (!hayNuevaSolicitud) {
    return NextResponse.json({
      total: 0,
      limit: 20,
      offset: 0,
      solicitudes: []
    }, { status: 200 });
  }

  const origen = ORIGENES[Math.floor(Math.random() * ORIGENES.length)];
  const destino = DESTINOS[Math.floor(Math.random() * DESTINOS.length)];
  const pasajero = PASAJEROS[Math.floor(Math.random() * PASAJEROS.length)];

  const distancia_km = parseFloat((Math.random() * 12 + 1.5).toFixed(1));
  const precio_estimado = Math.round(distancia_km * 850);
  const eta_min = Math.round(distancia_km * 2.5);

  const solicitud = {
    id_solicitud: `sol_mock_${Date.now()}`,
    id_pasajero: pasajero.id_pasajero,
    precio_estimado,
    metodo_pago: "EFECTIVO",
    created_at: new Date().toISOString(),
    eta_min,
    distancia_km,
    distance_m: Math.round(distancia_km * 1000),
    pasajero,
    origen,
    destino,
  };

  return NextResponse.json({
    total: 1,
    limit: 20,
    offset: 0,
    solicitudes: [solicitud]
  }, { status: 200 });
}