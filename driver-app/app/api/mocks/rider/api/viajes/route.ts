import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Bloqueo de seguridad: No exponer mocks en producción
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    console.log('[MOCK RIDER APP] Recibida sincronización de viaje:', body);

    return NextResponse.json({
      id_viaje: "mock-viaje-id",
      estado_actual: "ACEPTADO",
      pasajero: {
        id_pasajero: body.id_pasajero,
        nombre: "Pasajero Mock"
      },
      origen: {
        direccion: "Mock Origen",
        latitud: body.latitud_actual,
        longitud: body.longitud_actual
      },
      destino: {
        direccion: "Mock Destino",
        latitud: 0,
        longitud: 0
      }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid Payload" }, { status: 400 });
  }
}
