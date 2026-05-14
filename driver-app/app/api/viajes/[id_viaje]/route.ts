import { NextResponse } from 'next/server';
import { prisma, TransactionClient } from '@/lib/prisma';
import { handleError } from '@/lib/api-utils';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

const cancelSchema = z.object({
  estado: z.literal('CANCELADO_POR_CONDUCTOR'),
  motivo: z.string().optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id_viaje: string }> }) {
  try {
    const { id_viaje } = await params;
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (sessionClaims?.metadata as any)?.role || (sessionClaims as any)?.role;
    if (role !== 'driver') {
      return NextResponse.json({ error: "Forbidden: Solo conductores pueden cancelar el viaje" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = cancelSchema.parse(body);

    const viajeActual = await prisma.viaje.findUnique({ where: { id: id_viaje } });
    if (!viajeActual) {
      return NextResponse.json({ error: "Viaje no encontrado" }, { status: 404 });
    }

    if (viajeActual.id_conductor !== userId) {
      return NextResponse.json({ error: "Forbidden: No eres el conductor de este viaje" }, { status: 403 });
    }

    if (viajeActual.estado_actual === 'FINALIZADO') {
      return NextResponse.json({ error: "Bad Request: No se puede cancelar un viaje finalizado" }, { status: 400 });
    }

    const viajeUpdated = await prisma.$transaction(async (tx: TransactionClient) => {
      const v = await tx.viaje.update({
        where: { id: id_viaje },
        data: { estado_actual: parsed.estado }
      });

      await tx.conductor.update({
        where: { id: userId },
        data: { estado: 'ONLINE' }
      });

      return v;
    });

    return NextResponse.json({ success: true, data: viajeUpdated });
  } catch (error) {
    return handleError(error);
  }
}
