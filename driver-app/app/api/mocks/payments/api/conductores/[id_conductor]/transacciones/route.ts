import { NextResponse } from 'next/server';

// ── GET /mocks/payments/api/conductores/[id_conductor]/transacciones ──────────
// Mock del endpoint de Payments App que lista las transacciones del conductor.
// El campo `liquidacion` refleja el enum de Payments App: 'PENDIENTE' | 'LIQUIDADO'
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
  console.log(`[MOCK PAYMENTS APP] GET transacciones del conductor ${id_conductor}`);

  return NextResponse.json({
    id_conductor,
    transacciones: [
      {
        id_transaccion: 'txn_001',
        id_viaje: 'uuid-viaje-1',
        monto: 2500.00,
        tipo: 'EFECTIVO',
        liquidacion: 'LIQUIDADO',
        fecha: '2026-05-11T20:30:00Z',
      },
      {
        id_transaccion: 'txn_002',
        id_viaje: 'uuid-viaje-2',
        monto: 1800.50,
        tipo: 'MERCADO_PAGO',
        liquidacion: 'LIQUIDADO',
        fecha: '2026-05-13T15:10:00Z',
      },
      {
        id_transaccion: 'txn_003',
        id_viaje: 'uuid-viaje-3',
        monto: 3200.25,
        tipo: 'EFECTIVO',
        liquidacion: 'PENDIENTE',
        fecha: '2026-05-20T09:45:00Z',
      },
    ],
  });
}