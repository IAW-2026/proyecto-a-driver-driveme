import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-utils';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request, { params }: { params: Promise<{ id_viaje: string }> }) {
  try {
    const { id_viaje } = await params;
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (sessionClaims?.metadata as any)?.role || (sessionClaims as any)?.role;
    if (role !== 'rider') {
      return NextResponse.json({ error: "Forbidden: Solo pasajeros pueden consultar telemetría" }, { status: 403 });
    }

    const viaje = await prisma.viaje.findUnique({
      where: { id_viaje },
      include: { conductor: true }
    });

    if (!viaje) {
      return NextResponse.json({ success: false, error: 'Viaje no encontrado' }, { status: 404 });
    }

    if (viaje.id_pasajero !== userId) {
      return NextResponse.json({ error: "Forbidden: No eres el pasajero de este viaje" }, { status: 403 });
    }

    return NextResponse.json({
      id_viaje: viaje.id_viaje,
      coordenadas: {
        lat: viaje.conductor.latitud_actual,
        lng: viaje.conductor.longitud_actual
      },
      ultima_actualizacion: new Date().toISOString() // En un entorno real, sería el timestamp del último reporte
    });
  } catch (error) {
    return handleError(error);
  }
}
