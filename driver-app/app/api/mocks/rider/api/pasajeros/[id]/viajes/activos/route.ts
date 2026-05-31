import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_MOCKS !== 'true') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  const { id } = await params;
  console.log(`[MOCK RIDER APP] GET viaje activo del pasajero ${id}`);

  return NextResponse.json({
    id_pasajero: id,
    viaje_activo: {
      id_viaje: 'uuid-12345',
      id_solicitud: 'sol_abc123',
      estado_actual: 'EN_CURSO',
      id_conductor: 'cond_2pX...',
    },
  });
}