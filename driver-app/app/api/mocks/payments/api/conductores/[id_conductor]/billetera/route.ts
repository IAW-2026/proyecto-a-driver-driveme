import { NextResponse } from 'next/server';

// ── GET /mocks/payments/api/conductores/[id_conductor]/billetera ──────────────
// Mock del endpoint de Payments App que devuelve el estado de la billetera.
//   - saldo_a_liquidar:  monto ganado pendiente de transferencia
//   - saldo_liquidado:   acumulado histórico de liquidaciones procesadas
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id_conductor: string }> }
) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  const apiKey = request.headers.get('x-api-key');
  const authHeader = request.headers.get('authorization');
  const expectedKey = process.env.INTERNAL_API_KEY;

  if (!apiKey && !authHeader) {
    return NextResponse.json(
      { error: 'Unauthorized. Missing x-api-key or Bearer token.' },
      { status: 401 }
    );
  }

  if (expectedKey && apiKey !== expectedKey && authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json(
      { error: 'Unauthorized. Invalid M2M credentials.' },
      { status: 401 }
    );
  }

  const { id_conductor } = await params;
  console.log(`[MOCK PAYMENTS APP] GET billetera del conductor ${id_conductor}`);

  return NextResponse.json({
    id_conductor,
    saldo_a_liquidar: 12450.75,
    saldo_liquidado: 87300.00,
    moneda: 'ARS',
    ultima_actualizacion: new Date().toISOString(),
  });
}