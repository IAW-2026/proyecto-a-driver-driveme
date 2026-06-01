import { NextResponse } from 'next/server';
import { prisma, TransactionClient } from '@/lib/prisma';
import { handleError } from '@/lib/api-utils';
import { auth } from '@clerk/nextjs/server';
import { m2mHeaders } from '@/lib/m2m';
import { z } from 'zod';

const createViajeSchema = z.object({
  id_solicitud: z.string(),
  id_conductor: z.string(),
  id_pasajero: z.string(),
  id_vehiculo: z.string(),
  latitud_actual: z.number(),
  longitud_actual: z.number(),
  metodo_pago: z.enum(['EFECTIVO', 'MERCADO_PAGO']),
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
    const authResult = await auth();
    let userId = authResult.userId;

    // Bypass para pruebas de integración local
    if (
      (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') &&
      request.headers.get('Authorization')?.includes('test-jwt-token')
    ) {
      userId = request.headers.get('x-test-driver-id') || 'cond_test_123';
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

    // Verificar que existe como conductor activo y guardar su estado previo para posibles rollbacks
    const conductorExiste = await prisma.conductor.findUnique({
      where: { id_conductor: userId },
      select: { id_conductor: true, isActive: true, estado: true },
    });

    if (!conductorExiste || !conductorExiste.isActive) {
      return NextResponse.json(
        { error: 'Forbidden: Solo conductores activos pueden aceptar viajes' },
        { status: 403 }
      );
    }

    const estadoOriginalConductor = conductorExiste.estado;

    // Persistir el viaje localmente de forma transaccional
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

    try {
      const riderResponse = await fetch(`${process.env.RIDER_APP_URL}/api/viajes`, {
        method: 'POST',
        headers: m2mHeaders('rider'),
        body: JSON.stringify({
          id_solicitud: viaje.id_solicitud,
          id_conductor: viaje.id_conductor,
          id_vehiculo: viaje.id_vehiculo,
          latitud_actual: parsed.latitud_actual,
          longitud_actual: parsed.longitud_actual,
        }),
      });

      // MANEJO CORRECTO DEL CONFLICTO 409
      if (riderResponse.status === 409) {
        console.warn(`[CONFLICT] La solicitud ${parsed.id_solicitud} ya fue tomada. Iniciando reversión local...`);

        // Acción de compensación: deshacer los cambios en la base de datos de manera segura
        await prisma.$transaction(async (tx) => {
          await tx.viaje.delete({
            where: { id_viaje: viaje.id_viaje }
          });

          await tx.conductor.update({
            where: { id_conductor: parsed.id_conductor },
            data: { estado: estadoOriginalConductor }
          });
        });

        // Retornar 409 al frontend propio para disparar el aviso en pantalla
        return NextResponse.json(
          { error: 'La solicitud de viaje ya fue aceptada por otro conductor.' },
          { status: 409 }
        );
      }

      if (!riderResponse.ok) {
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