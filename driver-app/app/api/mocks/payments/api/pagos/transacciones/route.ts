import { NextResponse } from 'next/server';

// ── GET /mocks/payments/api/pagos/transacciones ───────────────────────────────
// Mock del endpoint C de Payments App (03-apis.md §C):
// GET /api/pagos/transacciones — historial de transacciones del conductor.
// Autenticación: Bearer JWT del usuario (Clerk). Rol resuelto en Payments App.
// Query param opcional: ?estado_liquidacion=PENDIENTE|LIQUIDADO
export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const estadoFiltro = searchParams.get('estado_liquidacion');

  console.log(`[MOCK PAYMENTS APP] GET /api/pagos/transacciones${estadoFiltro ? `?estado_liquidacion=${estadoFiltro}` : ''}`);

  const todasLasTransacciones = [
    {
      id: 'txn_001',
      idViaje: 'uuid-viaje-1',
      monto: '2500.00',
      metodoPago: 'EFECTIVO',
      estado: 'CONFIRMADO',
      estadoLiquidacion: 'LIQUIDADO',
      fechaCreacion: '2026-05-11T20:30:00.000Z',
    },
    {
      id: 'txn_002',
      idViaje: 'uuid-viaje-2',
      monto: '1800.50',
      metodoPago: 'MERCADO_PAGO',
      estado: 'CONFIRMADO',
      estadoLiquidacion: 'LIQUIDADO',
      fechaCreacion: '2026-05-13T15:10:00.000Z',
    },
    {
      id: 'txn_003',
      idViaje: 'uuid-viaje-3',
      monto: '3200.25',
      metodoPago: 'EFECTIVO',
      estado: 'CONFIRMADO',
      estadoLiquidacion: 'PENDIENTE',
      fechaCreacion: '2026-05-20T09:45:00.000Z',
    },
    {
      id: 'txn_004',
      idViaje: 'uuid-viaje-4',
      monto: '9250.50',
      metodoPago: 'EFECTIVO',
      estado: 'CONFIRMADO',
      estadoLiquidacion: 'PENDIENTE',
      fechaCreacion: '2026-05-28T18:00:00.000Z',
    },
  ];

  const transacciones = estadoFiltro
    ? todasLasTransacciones.filter((t) => t.estadoLiquidacion === estadoFiltro)
    : todasLasTransacciones;

  return NextResponse.json(transacciones);
}

// ── PUT /mocks/payments/api/pagos/transacciones ───────────────────────────────
// Mock del endpoint de Payments App (03-apis.md):
// PUT /api/pagos/transacciones — procesa el cobro al finalizar un viaje (M2M).
// Body: { id_transaccion: string }
// Response: ProcesarCobroResponse { id_transaccion, estado: "CAPTURED" }
export async function PUT(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const id_transaccion = body?.id_transaccion ?? `txn_mock_${Date.now()}`;

  console.log(`[MOCK PAYMENTS APP] PUT /api/pagos/transacciones — id_transaccion: ${id_transaccion}`);

  return NextResponse.json({
    id_transaccion,
    estado: 'CAPTURED',
  });
}
