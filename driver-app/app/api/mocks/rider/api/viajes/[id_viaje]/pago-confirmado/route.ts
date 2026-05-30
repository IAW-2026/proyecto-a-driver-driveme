import { NextResponse } from 'next/server';

// ── POST /mocks/rider/api/viajes/[id_viaje]/pago-confirmado ───────────────────
// Mock del webhook de Rider App que recibe la confirmación de pago
// cuando el conductor finaliza un viaje con método EFECTIVO.
// Body: WebhookPagoConfirmadoRequest { id_transaccion, estado, monto }
// Response: 200 OK con acuse de recibo.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id_viaje: string }> }
) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  const { id_viaje } = await params;

  const apiKey = request.headers.get('x-api-key');
  const authHeader = request.headers.get('authorization');

  if (!apiKey && !authHeader) {
    return NextResponse.json({ error: 'Unauthorized M2M access' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));

  console.log(
    `[MOCK RIDER APP] POST /api/viajes/${id_viaje}/pago-confirmado — ` +
    `id_transaccion: ${body?.id_transaccion}, estado: ${body?.estado}, monto: ${body?.monto}`
  );

  return NextResponse.json({
    recibido: true,
    id_viaje,
    id_transaccion: body?.id_transaccion ?? null,
    estado: body?.estado ?? 'CAPTURED',
  });
}
