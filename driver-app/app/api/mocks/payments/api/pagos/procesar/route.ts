import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    console.log('[MOCK PAYMENTS APP] Procesando cobro:', body);

    return NextResponse.json({
      id_transaccion: "mock-tx-12345",
      estado: "CAPTURED"
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid Payload" }, { status: 400 });
  }
}
