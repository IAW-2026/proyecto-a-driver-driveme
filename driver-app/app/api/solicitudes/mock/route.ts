import { NextResponse } from 'next/server';
import { prisma, TransactionClient } from '@/lib/prisma';
import { handleError } from '@/lib/api-utils';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

const createViajeSchema = z.object({
  id_solicitud: z.string(),
  id_conductor: z.string(),
  id_pasajero: z.string(),
  id_vehiculo: z.string(),
  latitud_actual: z.number(),
  longitud_actual: z.number(),
  metodo_pago: z.enum(['EFECTIVO', 'TARJETA']),
  precio_estimado: z.number(),
  origen_latitud: z.number().optional(),
  origen_longitud: z.number().optional(),
  origen_direccion: z.string().optional(),
  destino_latitud: z.number().optional(),
  destino_longitud: z.number().optional(),
  destino_direccion: z.string().optional(),
  pasajero_nombre: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    let { userId, sessionClaims } = await auth();
    let role = (sessionClaims?.metadata as any)?.role || (sessionClaims as any)?.role;

    // Bypass para pruebas de integración local
    if (
      (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') &&
      request.headers.get('Authorization')?.includes('test-jwt-token')
    ) {
      userId = request.headers.get('x-test-driver-id') || 'cond_test_123';
      role = 'driver';
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createViajeSchema.parse(body);

    // Verificar que el conductor autenticado es quien acepta el viaje
    if (parsed.id_conductor !== userId) {
      return NextResponse.json(
        { error: 'Forbidden: No podés aceptar viajes para otro conductor' },
        { status: 403 }
      );
    }

    // Verificar que existe como conductor activo en la BD
    const conductorExiste = await prisma.conductor.findUnique({
      where: { id_conductor: userId },
      select: { id_conductor: true, isActive: true },
    });
    if (!conductorExiste || !conductorExiste.isActive) {
      return NextResponse.json(
        { error: 'Forbidden: Solo conductores activos pueden aceptar viajes' },
        { status: 403 }
      );
    }

    const viaje = await prisma.$transaction(async (tx: TransactionClient) => {
      const v = await tx.viaje.create({
        data: {
          id_solicitud: parsed.id_solicitud,
          id_conductor: parsed.id_conductor,
          id_pasajero: parsed.id_pasajero,
          id_vehiculo: parsed.id_vehiculo,
          estado_actual: 'ACEPTADO',
          metodo_pago: parsed.metodo_pago,
          precio: parsed.precio_estimado,
          precio_final: parsed.precio_estimado,
          origen_latitud: parsed.origen_latitud,
          origen_longitud: parsed.origen_longitud,
          origen_direccion: parsed.origen_direccion,
          destino_latitud: parsed.destino_latitud,
          destino_longitud: parsed.destino_longitud,
          destino_direccion: parsed.destino_direccion,
          pasajero_nombre: parsed.pasajero_nombre,
        },
      });

      await tx.conductor.update({
        where: { id_conductor: parsed.id_conductor },
        data: {
          estado: 'OCUPADO',
          latitud_actual: parsed.latitud_actual,
          longitud_actual: parsed.longitud_actual,
        },
      });

      return v;
    });

    // ── Llamada M2M saliente → Rider App ─────────────────────────────────────
    // Según el contrato (03-apis.md §Rider A), este endpoint requiere
    // x-api-key o Authorization: Bearer. Sin el header, Rider devuelve 403.
    const internalApiKey = process.env.INTERNAL_API_KEY;
    if (!internalApiKey) {
      // En producción esto sería un error crítico; lo logueamos claramente.
      console.error(
        '[ERROR] INTERNAL_API_KEY no está definida en las variables de entorno. ' +
        'La sincronización M2M con Rider App no puede realizarse de forma segura.'
      );
    }

    try {
      const riderResponse = await fetch(`${process.env.RIDER_APP_URL}/api/viajes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Header M2M requerido por el contrato — sin esto Rider App rechaza con 403
          ...(internalApiKey ? { 'x-api-key': internalApiKey } : {}),
        },
        body: JSON.stringify({
          id_solicitud: viaje.id_solicitud,
          id_conductor: viaje.id_conductor,
          id_vehiculo: viaje.id_vehiculo,
          latitud_actual: parsed.latitud_actual,
          longitud_actual: parsed.longitud_actual,
        }),
      });

      if (riderResponse.status === 409) {
        // Otro conductor ya aceptó esta solicitud — según el contrato hay que informarlo
        console.warn(`[WARNING] Rider App reportó conflicto (409): la solicitud ${parsed.id_solicitud} ya fue aceptada por otro conductor.`);
        // Nota: el viaje local ya fue creado. En producción habría que revertirlo o
        // marcarlo como CANCELADO_POR_CONDUCTOR. Por ahora lo logueamos y seguimos.
      } else if (!riderResponse.ok) {
        console.warn(
          `[WARNING] Rider App devolvió estado ${riderResponse.status} al sincronizar el viaje ${viaje.id_viaje}.`
        );
      }
    } catch (e) {
      console.warn(
        '[WARNING] Rider App inalcanzable. El viaje local se guardó, pero la sincronización M2M falló.',
        e
      );
    }

    return NextResponse.json({ success: true, data: viaje }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}