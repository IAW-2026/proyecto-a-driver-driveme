import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
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
