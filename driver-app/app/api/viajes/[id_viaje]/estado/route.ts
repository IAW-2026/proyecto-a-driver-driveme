import { NextResponse } from 'next/server';
import { prisma, TransactionClient } from '@/lib/prisma';
import { handleError } from '@/lib/api-utils';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

export async function GET(request: Request, { params }: { params: Promise<{ id_viaje: string }> }) {
  try {
    const { id_viaje } = await params;
    
    // Aquí idealmente validaríamos un token M2M o API Key para Feedback App
    // Por simplicidad en este ejemplo, consultamos directamente
    const viaje = await prisma.viaje.findUnique({
      where: { id_viaje },
      select: {
        id_viaje: true,
        estado_actual: true,
        id_conductor: true,
        id_pasajero: true,
        tiempo_completado: true
      }
    });

    if (!viaje) {
      return NextResponse.json({ success: false, error: 'Viaje no encontrado' }, { status: 404 });
    }

    return NextResponse.json(viaje);
  } catch (error) {
    return handleError(error);
  }
}

const patchSchema = z.object({
  estado_actual: z.enum(['EN_CURSO', 'FINALIZADO'])
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id_viaje: string }> }) {
  try {
    const { id_viaje } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    const body = await request.json();
    const parsed = patchSchema.parse(body);

    const viajeActual = await prisma.viaje.findUnique({ where: { id_viaje } });
    if (!viajeActual) {
      return NextResponse.json({ error: "Viaje no encontrado" }, { status: 404 });
    }

    if (viajeActual.id_conductor !== userId) {
      return NextResponse.json({ error: "Forbidden: No eres el conductor de este viaje" }, { status: 403 });
    }

    const dataToUpdate: any = { estado_actual: parsed.estado_actual };
    if (parsed.estado_actual === 'EN_CURSO' && !viajeActual.tiempo_comienzo) {
      dataToUpdate.tiempo_comienzo = new Date();
    } else if (parsed.estado_actual === 'FINALIZADO' && !viajeActual.tiempo_completado) {
      dataToUpdate.tiempo_completado = new Date();
    }

    const viajeUpdated = await prisma.$transaction(async (tx: TransactionClient) => {
      const v = await tx.viaje.update({
        where: { id_viaje },
        data: dataToUpdate
      });

      if (parsed.estado_actual === 'FINALIZADO') {
        await tx.conductor.update({
          where: { id_conductor: userId },
          data: { estado: 'ONLINE' }
        });
      }
      return v;
    });

    return NextResponse.json({ success: true, data: viajeUpdated });
  } catch (error) {
    return handleError(error);
  }
}
