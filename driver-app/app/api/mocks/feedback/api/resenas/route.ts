import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  // Validación M2M/local: acepta x-api-key o Authorization Bearer.
  const apiKey = request.headers.get('x-api-key');
  const authHeader = request.headers.get('authorization');
  const expectedKey = process.env.INTERNAL_API_KEY;

  if (!apiKey && !authHeader) {
    return NextResponse.json(
      { error: "Unauthorized. Missing x-api-key or Bearer token." },
      { status: 401 }
    );
  }

  if (expectedKey) {
    const expectedAuth = `Bearer ${expectedKey}`;
    if (apiKey !== expectedKey && authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: "Unauthorized. Invalid M2M credentials." },
        { status: 401 }
      );
    }
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