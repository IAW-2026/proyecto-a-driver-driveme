import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    console.log('[MOCK FEEDBACK APP] Reporte recibido:', body);

    // Delay simulado (500ms) para testear estado de carga en el botón de "Enviar Reporte"
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json(
      {
        id_reporte: 'rep_' + Math.random().toString(36).substring(2, 11),
        estado: 'PENDIENTE',
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: 'Invalid Payload' }, { status: 400 });
  }
}