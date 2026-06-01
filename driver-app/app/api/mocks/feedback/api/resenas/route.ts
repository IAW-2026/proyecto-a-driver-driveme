import { NextResponse } from 'next/server';
import { validateM2M } from '@/lib/m2m';

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_MOCKS !== 'true') {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  if (!validateM2M(request)) {
    return NextResponse.json(
      { error: "Unauthorized M2M access" },
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
  } catch {
    return NextResponse.json({ error: "Invalid Payload" }, { status: 400 });
  }
}