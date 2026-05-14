// app/api/feedback/usuarios/[id]/calificaciones/route.ts
import { NextResponse } from 'next/server';
import { HistorialCalificacionesResponse } from '@/app/types/api';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const mockResponse: HistorialCalificacionesResponse = {
    id_usuario: params.id,
    calificacion_promedio: 4.8,
    total_calificaciones: 124,
    detalles: [
      {
        id_calificacion: "cal_999",
        id_viaje: "uuid-old-1",
        puntaje: 5,
        comentario: "Excelente conductor, muy amable.",
        id_emisor: "pas_user_1",
        timestamp: "2026-05-10T14:00:00Z"
      }
    ]
  };

  return NextResponse.json(mockResponse);
}