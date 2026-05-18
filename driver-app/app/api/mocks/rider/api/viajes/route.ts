import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Bloqueo de seguridad: No exponer mocks en producción
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  // Validación M2M requerida por la documentación
  const apiKey = request.headers.get('x-api-key');
  const authHeader = request.headers.get('authorization');

  if (!apiKey && !authHeader) {
    return NextResponse.json({ error: "Unauthorized M2M access" }, { status: 403 });
  }

  try {
    const body = await request.json();
    console.log('[MOCK RIDER APP] Recibida sincronización de viaje:', body);

    // Simulamos la respuesta exitosa de la Rider App
    return NextResponse.json({
      id_viaje: "mock-viaje-id",
      id_solicitud: body.id_solicitud || "sol_abc123",
      estado_actual: "ACEPTADO",
      precio_estimado: 2550.00,
      metodo_pago: "TARJETA",
      pasajero: {
        id_pasajero: "pas_mock_123"
      },
      origen: {
        direccion: "Mock Origen",
        latitud: -38.7191,
        longitud: -62.2652
      },
      destino: {
        direccion: "Mock Destino",
        latitud: -38.7021,
        longitud: -62.2801
      }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid Payload" }, { status: 400 });
  }
}