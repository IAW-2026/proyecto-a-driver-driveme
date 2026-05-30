import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// ── GET /api/payments/conductores/[id_conductor]/transacciones ────────────────
// BFF proxy: reenvía la petición del conductor autenticado al endpoint
// Payments App → GET /api/pagos/transacciones (con JWT Clerk, rol DRIVER)
// La documentación (03-apis.md §C) especifica que este endpoint acepta el
// JWT del usuario; el rol se resuelve en Payments App desde la base de datos.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id_conductor: string }> }
) {
  try {
    const authResult = await auth();
    const token = await authResult.getToken();
    const userId = authResult.userId;

    if (!userId || !token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id_conductor } = await params;

    if (userId !== id_conductor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const paymentsAppUrl = process.env.PAYMENTS_APP_URL;

    if (!paymentsAppUrl) {
      console.error('[ERROR] PAYMENTS_APP_URL no está definida en las variables de entorno.');
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta' },
        { status: 500 }
      );
    }

    // Reenviar query params (ej: ?estado_liquidacion=PENDIENTE)
    const { searchParams } = new URL(request.url);
    const query = searchParams.toString();

    const res = await fetch(
      `${paymentsAppUrl}/api/pagos/transacciones${query ? `?${query}` : ''}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      console.warn(
        `[WARNING] Payments App respondió con estado ${res.status} al obtener transacciones del conductor ${id_conductor}.`
      );
      return NextResponse.json(
        { error: 'Error al obtener las transacciones' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[ERROR] Falló la comunicación con Payments App al obtener transacciones:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}