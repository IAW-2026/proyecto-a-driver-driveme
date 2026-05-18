import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-utils';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

// ── Helper: validación M2M ────────────────────────────────────────────────────
// Acepta x-api-key o Authorization: Bearer, según el contrato en 03-apis.md.
// Devuelve true si la request está autorizada como llamada M2M.
function validateM2M(request: Request): boolean {
  const apiKey = request.headers.get('x-api-key');
  const authHeader = request.headers.get('authorization');
  const expectedKey = process.env.INTERNAL_API_KEY;
  const expectedToken = process.env.FEEDBACK_APP_TOKEN;

  if (!expectedKey && !expectedToken) {
    console.error('[ERROR] INTERNAL_API_KEY y FEEDBACK_APP_TOKEN no están definidas. El endpoint M2M está desprotegido.');
    return false;
  }

  return (
    (!!apiKey && apiKey === expectedKey) ||
    (!!authHeader && (authHeader === `Bearer ${expectedToken}` || authHeader === `Bearer ${expectedKey}`))
  );
}

// ── GET /api/viajes/[id_viaje]/estado ─────────────────────────────────────────
// [M2M] Consumidor: Feedback App
// Valida que el viaje finalizó antes de permitir una reseña.
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

// ── PATCH /api/viajes/[id_viaje]/estado ───────────────────────────────────────
// User JWT (conductor autenticado) — sin cambios respecto al original.
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

    return NextResponse.json({ success: true, data: viajeUpdated });
  } catch (error) {
    return handleError(error);
  }
}