import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id_viaje: string }> }
) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { id_viaje } = await params;
    console.log(`[MOCK RIDER APP] Notificación de cambio de estado recibida para el viaje ${id_viaje}:`, body);

    // Devolvemos 200 OK tal cual estipula el contrato
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid Payload" }, { status: 400 });
  }
}