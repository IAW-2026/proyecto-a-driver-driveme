import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const riderAppUrl = process.env.RIDER_APP_URL;
  const internalApiKey = process.env.INTERNAL_API_KEY;

  if (!riderAppUrl) {
    console.error("[ERROR] RIDER_APP_URL no está definida en las variables de entorno.");
    return NextResponse.json({ error: "Configuración del servidor incompleta" }, { status: 500 });
  }

  try {
    const res = await fetch(`${riderAppUrl}/api/solicitudes?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(internalApiKey ? { 'x-api-key': internalApiKey } : {}),
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      console.warn(`[WARNING] Rider App respondió con estado ${res.status} al buscar solicitudes.`);
      return NextResponse.json(
        { error: "Error al consultar las solicitudes" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("[ERROR] Falló la comunicación con Rider App:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}