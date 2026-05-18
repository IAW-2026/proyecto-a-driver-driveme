// app/api/rider/pasajeros/[id]/viajes/activos/route.ts
import { NextResponse } from 'next/server';
import { ViajeActivoPasajeroResponse } from '@/app/types/api';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const mockResponse: ViajeActivoPasajeroResponse = {
    id_pasajero: id,
    viaje_activo: {
      id_viaje: "uuid-12345",
      id_solicitud: "sol_abc123",
      estado_actual: 'EN_CURSO',
      id_conductor: "cond_2pX..."
    }
  };

  return NextResponse.json(mockResponse);
}