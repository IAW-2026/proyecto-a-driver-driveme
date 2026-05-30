import { NextResponse } from 'next/server';

// ── GET /mocks/payments/api/pagos/liquidaciones ───────────────────────────────
// Mock del endpoint E de Payments App (03-apis.md §E):
// GET /api/pagos/liquidaciones — devuelve billetera + historial de liquidaciones.
// Autenticación: Bearer JWT del conductor (no requiere M2M).
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  console.log('[MOCK PAYMENTS APP] GET /api/pagos/liquidaciones');

  return NextResponse.json({
    montoPendiente: 12450.75,
    montoLiquidado: 87300.00,
    liquidaciones: [
      {
        id: 'liq_001',
        montoPagado: 22500.00,
        estado: 'PROCESADA',
        fechaEjecutada: '2026-05-28T00:00:00.000Z',
      },
      {
        id: 'liq_002',
        montoPagado: 18900.00,
        estado: 'PROCESADA',
        fechaEjecutada: '2026-05-21T00:00:00.000Z',
      },
      {
        id: 'liq_003',
        montoPagado: 45900.00,
        estado: 'PROCESADA',
        fechaEjecutada: '2026-05-14T00:00:00.000Z',
      },
    ],
  });
}

// ── POST /mocks/payments/api/pagos/liquidaciones ──────────────────────────────
// Mock del endpoint D de Payments App (03-apis.md §D):
// POST /api/pagos/liquidaciones — solicita liquidación de ganancias pendientes.
// Autenticación: Bearer JWT del conductor. No requiere body.
export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  console.log('[MOCK PAYMENTS APP] POST /api/pagos/liquidaciones — Procesando liquidación');

  return NextResponse.json({
    id_liquidacion: `liq_mock_${Date.now()}`,
    monto_pagado: 12450.75,
    estado: 'PROCESADA',
  });
}
