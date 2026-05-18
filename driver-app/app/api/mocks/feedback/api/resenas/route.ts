import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  // Validación de Autenticación requerida por la documentación
  // Según la doc (Endpoints A y B), requiere un JWT (Bearer token del pasajero o conductor)
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: "Unauthorized. Missing or invalid Bearer token." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    console.log('[MOCK FEEDBACK APP] Reseña recibida:', body);

    return NextResponse.json({
      id_calificacion: "mock-cal-123",
      estado: "REGISTRADA",
      timestamp: new Date().toISOString()
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid Payload" }, { status: 400 });
  }
}