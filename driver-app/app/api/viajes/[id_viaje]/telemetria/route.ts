import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-utils';
import { auth } from '@clerk/nextjs/server';
import { validateM2M } from '@/lib/m2m';

function getRoleFromSessionClaims(sessionClaims: unknown): string | null {
  if (typeof sessionClaims !== 'object' || sessionClaims === null) {
    return null;
  }

  const claims = sessionClaims as Record<string, unknown>;
  const metadata = claims.metadata;
  if (typeof metadata === 'object' && metadata !== null) {
    const metadataRole = (metadata as Record<string, unknown>)['role'];
    if (typeof metadataRole === 'string') {
      return metadataRole;
    }
  }

  const directRole = claims.role;
  if (typeof directRole === 'string') {
    return directRole;
  }

  return null;
}

export async function GET(request: Request, { params }: { params: Promise<{ id_viaje: string }> }) {
  try {
    const { id_viaje } = await params;

    // 1. Verificación M2M (Para cuando la Rider App u otro servicio consume esto)
    const isM2M = validateM2M(request);

    let userId: string | null = null;
    let role: string | null = null;

    // 2. Si no es M2M, validamos la sesión de Clerk (Para cuando el frontend lo consume)
    if (!isM2M) {
      const authData = await auth();
      userId = authData.userId;

      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      role = getRoleFromSessionClaims(authData.sessionClaims);
    }

    // Buscamos el viaje en la base de datos
    const viaje = await prisma.viaje.findUnique({
      where: { id_viaje },
      include: { conductor: true }
    });

    if (!viaje) {
      return NextResponse.json({ success: false, error: 'Viaje no encontrado' }, { status: 404 });
    }

    // 3. Verificación de permisos (Solo si es una petición desde el frontend)
    if (!isM2M) {
      if (role === 'rider' && viaje.id_pasajero !== userId) {
        return NextResponse.json({ error: "Forbidden: No sos el pasajero de este viaje" }, { status: 403 });
      }
      if (role === 'driver' && viaje.id_conductor !== userId) {
        return NextResponse.json({ error: "Forbidden: No sos el conductor de este viaje" }, { status: 403 });
      }
    }

    // 4. Retornamos la telemetría según el contrato
    return NextResponse.json({
      id_viaje: viaje.id_viaje,
      coordenadas: {
        lat: viaje.conductor?.latitud_actual ?? 0,
        lng: viaje.conductor?.longitud_actual ?? 0
      },
      rumbo: 0, // Mockeado hasta que implementes cálculos reales de dirección
      velocidad_kmh: 0, // Mockeado
      ultima_actualizacion: new Date().toISOString()
    });
  } catch (error) {
    return handleError(error);
  }
}