import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// ── GET /api/payments/liquidaciones ───────────────────────────────────────────
// Consumidor: Driver App (este archivo)
// Proveedor: Payments App → POST /api/pagos/liquidaciones
//
// Obtiene la liquidación semanal del conductor autenticado.
// La Driver App llama al endpoint de la Payments App usando M2M,
// y reenvía el resultado al frontend del conductor.
export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paymentsAppUrl = process.env.PAYMENTS_APP_URL;
    const internalApiKey = process.env.INTERNAL_API_KEY;

    if (!paymentsAppUrl) {
      console.error('[ERROR] PAYMENTS_APP_URL no está definida en las variables de entorno.');
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta' },
        { status: 500 }
      );
    }

    // Llamada M2M a la Payments App para solicitar la liquidación semanal
    const res = await fetch(`${paymentsAppUrl}/api/pagos/liquidaciones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(internalApiKey ? { 'x-api-key': internalApiKey } : {}),
      },
      body: JSON.stringify({ id_conductor: userId }),
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn(
        `[WARNING] Payments App respondió con estado ${res.status} al solicitar liquidación del conductor ${userId}.`
      );
      return NextResponse.json(
        { error: 'Error al obtener la liquidación semanal' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[ERROR] Falló la comunicación con Payments App al obtener liquidación:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
