import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-utils';
import { z } from 'zod';

import { validateM2M } from '@/lib/m2m';

const reputacionSchema = z.object({
  puntaje: z.number().min(1).max(5),
  comentario_promedio: z.string().nullable().optional(),
});

// ── PATCH /api/conductores/[id_conductor]/reputacion ──────────────────────────
// [M2M] Consumidor: Feedback App
// Recibe el nuevo puntaje y recalcula el promedio acumulado del conductor.
//
// NOTA sobre el cálculo:
// Feedback App envía el puntaje de la reseña más reciente (no el promedio ya calculado).
// Se usa la fórmula de promedio móvil incremental:
//   nuevo_promedio = (promedio_actual * total_viajes_finalizados + puntaje) / (total_viajes_finalizados + 1)
// Esto evita pisar el histórico con un solo valor.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id_conductor: string }> }
) {
  try {
    const { id_conductor } = await params;

    if (!validateM2M(request)) {
      return NextResponse.json({ error: 'Unauthorized M2M access' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = reputacionSchema.parse(body);

    const conductor = await prisma.conductor.findUnique({
      where: { id_conductor },
      select: {
        id_conductor: true,
        calificacion_promedio: true,
        // Contamos los viajes finalizados como base del promedio acumulado
        viajes: {
          where: { estado_actual: 'FINALIZADO' },
          select: { id_viaje: true },
        },
      },
    });

    if (!conductor) {
      return NextResponse.json({ error: 'Conductor no encontrado' }, { status: 404 });
    }

    const totalViajes = conductor.viajes.length;
    const promedioActual = conductor.calificacion_promedio;

    // Promedio móvil incremental: no pisamos el histórico con un solo valor
    const nuevaCalificacion =
      totalViajes === 0
        ? parsed.puntaje
        : (promedioActual * totalViajes + parsed.puntaje) / (totalViajes + 1);

    const updated = await prisma.conductor.update({
      where: { id_conductor },
      data: {
        calificacion_promedio: Math.round(nuevaCalificacion * 100) / 100, // 2 decimales
        ...(parsed.comentario_promedio !== undefined && { comentario_promedio: parsed.comentario_promedio }),
      },
      select: {
        id_conductor: true,
        calificacion_promedio: true,
        comentario_promedio: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return handleError(error);
  }
}
