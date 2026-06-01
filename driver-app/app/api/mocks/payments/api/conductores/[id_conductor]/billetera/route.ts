import { NextResponse } from 'next/server';
import { validateM2M } from '@/lib/m2m';

// ── GET /mocks/payments/api/conductores/[id_conductor]/billetera ──────────────
// Mock del endpoint de Payments App que devuelve el estado de la billetera.
//   - saldo_a_liquidar:  monto ganado pendiente de transferencia
//   - saldo_liquidado:   acumulado histórico de liquidaciones procesadas
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id_conductor: string }> }
) {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_MOCKS !== 'true') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  if (!validateM2M(request)) {
    return NextResponse.json(
      { error: 'Unauthorized M2M access' },
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