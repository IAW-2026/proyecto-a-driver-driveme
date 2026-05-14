import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-utils';
import { z } from 'zod';

const reputacionSchema = z.object({
  id_conductor: z.string(),
  puntaje: z.number().min(1).max(5)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = reputacionSchema.parse(body);

    // Validación M2M idealmente va aquí

    const conductor = await prisma.conductor.findUnique({
      where: { id_conductor: parsed.id_conductor }
    });

    if (!conductor) {
      return NextResponse.json({ success: false, error: 'Conductor no encontrado' }, { status: 404 });
    }

    const updated = await prisma.conductor.update({
      where: { id_conductor: parsed.id_conductor },
      data: { calificacion_promedio: parsed.puntaje }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return handleError(error);
  }
}
