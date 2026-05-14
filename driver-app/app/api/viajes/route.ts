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
  precio_estimado: z.number()
});

export async function POST(request: Request) {
  try {
    let { userId, sessionClaims } = await auth();
    let role = (sessionClaims?.metadata as any)?.role || (sessionClaims as any)?.role;

    // Bypass para pruebas de integración local
    if ((process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') && request.headers.get('Authorization')?.includes('test-jwt-token')) {
      userId = request.headers.get('x-test-driver-id') || 'cond_test_123';
      role = 'driver';
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (role !== 'driver') {
      return NextResponse.json({ error: "Forbidden: Solo conductores pueden aceptar viajes" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createViajeSchema.parse(body);

    if (parsed.id_conductor !== userId) {
      return NextResponse.json({ error: "Forbidden: No puedes aceptar viajes para otro conductor" }, { status: 403 });
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
          precio_final: parsed.precio_estimado
        }
      });

      await tx.conductor.update({
        where: { id_conductor: parsed.id_conductor },
        data: {
          estado: 'OCUPADO',
          latitud_actual: parsed.latitud_actual,
          longitud_actual: parsed.longitud_actual
        }
      });

      return v;
    });

    // Llamada saliente (Outbound) a Rider App (POST /api/viajes)
    try {
      const riderResponse = await fetch(`${process.env.RIDER_APP_URL}/api/viajes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_solicitud: viaje.id_solicitud,
          id_conductor: viaje.id_conductor,
          id_vehiculo: viaje.id_vehiculo,
          latitud_actual: parsed.latitud_actual,
          longitud_actual: parsed.longitud_actual
        })
      });
      if (!riderResponse.ok) {
        console.warn(`[WARNING] Rider App devolvió estado ${riderResponse.status} al sincronizar.`);
      }
    } catch (e) {
      console.warn("[WARNING] Rider App inalcanzable. El viaje local se guardó, pero la sincronización falló.", e);
    }

    return NextResponse.json({ success: true, data: viaje }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
