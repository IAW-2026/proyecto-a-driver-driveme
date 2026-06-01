import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-utils';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

import { validateM2M, m2mHeaders } from '@/lib/m2m';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id_viaje: string }> }
) {
  try {
    const { id_viaje } = await params;

    if (!validateM2M(request)) {
      return NextResponse.json({ error: 'Unauthorized M2M access' }, { status: 403 });
    }

    const viaje = await prisma.viaje.findUnique({
      where: { id_viaje },
      select: {
        id_viaje: true,
        estado_actual: true,
        id_conductor: true,
        id_pasajero: true,
        tiempo_completado: true,
      },
    });

    if (!viaje) {
      return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      id_viaje: viaje.id_viaje,
      estado_actual: viaje.estado_actual,
      id_conductor: viaje.id_conductor,
      id_pasajero: viaje.id_pasajero,
      tiempo_completado: viaje.tiempo_completado,
    });
  } catch (error) {
    return handleError(error);
  }
}

const patchSchema = z.object({
  estado_actual: z.enum(['EN_CURSO', 'FINALIZADO']),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id_viaje: string }> }
) {
  try {
    const { id_viaje } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = patchSchema.parse(body);

    const viajeActual = await prisma.viaje.findUnique({ where: { id_viaje } });
    if (!viajeActual) {
      return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 });
    }

    if (viajeActual.id_conductor !== userId) {
      return NextResponse.json(
        { error: 'Forbidden: No eres el conductor de este viaje' },
        { status: 403 }
      );
    }

    const dataToUpdate: Record<string, unknown> = { estado_actual: parsed.estado_actual };
    if (parsed.estado_actual === 'EN_CURSO' && !viajeActual.tiempo_comienzo) {
      dataToUpdate.tiempo_comienzo = new Date();
    } else if (parsed.estado_actual === 'FINALIZADO' && !viajeActual.tiempo_completado) {
      dataToUpdate.tiempo_completado = new Date();
    }

    const viajeUpdated = await prisma.$transaction(async (tx) => {
      const v = await tx.viaje.update({ where: { id_viaje }, data: dataToUpdate });
      if (parsed.estado_actual === 'FINALIZADO') {
        await tx.conductor.update({
          where: { id_conductor: userId },
          data: { estado: 'ONLINE' },
        });
      }
      return v;
    });

    if (parsed.estado_actual === 'FINALIZADO' && viajeActual.metodo_pago === 'EFECTIVO') {
      const paymentsAppUrl = process.env.PAYMENTS_APP_URL;
      if (!paymentsAppUrl) {
        console.error('[ERROR] PAYMENTS_APP_URL no definida. No se pudo notificar el pago en efectivo.');
      } else {
        try {
          const res = await fetch(`${paymentsAppUrl}/api/pagos/transacciones`, {
            method: 'PUT',
            headers: m2mHeaders('payments'),
            body: JSON.stringify({
              id_transaccion: id_viaje,
            }),
          });

          let idTransaccion = id_viaje;
          if (res.ok) {
            const pagoData = await res.json().catch(() => ({}));
            if (pagoData.id_transaccion) idTransaccion = pagoData.id_transaccion;
          } else {
            console.warn(`[WARNING] Payments App respondió ${res.status} al notificar pago en efectivo del viaje ${id_viaje}.`);
          }


        } catch (e) {
          console.warn('[WARNING] Payments App inalcanzable. El viaje se finalizó pero el pago no fue notificado.', e);
        }
      }
    }

    return NextResponse.json({ success: true, data: viajeUpdated });
  } catch (error) {
    return handleError(error);
  }
}