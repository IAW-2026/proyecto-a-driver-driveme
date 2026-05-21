import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// ── GET /api/payments/conductores/[id_conductor]/billetera ────────────────────
// Consumidor: Driver App (este archivo)
// Proveedor:  Payments App → GET /api/conductores/[id_conductor]/billetera
//
// Retorna el estado actual de la billetera del conductor:
//   - saldo_a_liquidar:  monto ganado aún no transferido
//   - saldo_liquidado:   acumulado histórico de liquidaciones procesadas
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id_conductor: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id_conductor } = await params;

    if (userId !== id_conductor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

    const res = await fetch(
      `${paymentsAppUrl}/api/conductores/${id_conductor}/billetera`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(internalApiKey ? { 'x-api-key': internalApiKey } : {}),
        },
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      console.warn(
        `[WARNING] Payments App respondió con estado ${res.status} al obtener billetera del conductor ${id_conductor}.`
      );
      return NextResponse.json(
        { error: 'Error al obtener la billetera' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[ERROR] Falló la comunicación con Payments App al obtener billetera:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}