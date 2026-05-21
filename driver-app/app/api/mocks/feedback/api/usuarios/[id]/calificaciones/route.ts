import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  const { id } = await params;
  console.log(`[MOCK FEEDBACK APP] GET calificaciones del usuario ${id}`);

  return NextResponse.json({
    id_usuario: id,
    calificacion_promedio: 4.8,
    total_calificaciones: 124,
    detalles: [
      {
        id_calificacion: 'cal_999',
        id_viaje: 'uuid-old-1',
        puntaje: 5,
        comentario: 'Excelente conductor, muy amable.',
        id_emisor: 'pas_user_1',
        timestamp: '2026-05-10T14:00:00Z',
      },
    ],
  });
}