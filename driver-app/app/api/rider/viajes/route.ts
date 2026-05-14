// app/api/rider/viajes/route.ts
import { NextResponse } from 'next/server';
import { SincronizarViajeRiderRequest, SincronizarViajeRiderResponse } from '@/app/types/api';

export async function POST(request: Request) {
  const body: SincronizarViajeRiderRequest = await request.json();

  const mockResponse: SincronizarViajeRiderResponse = {
    id_viaje: "uuid-" + Math.random().toString(36).substr(2, 9),
    estado_actual: 'ACEPTADO',
    pasajero: {
      id_pasajero: "pas_9qL75",
      nombre: "Juan Perez"
    },
    origen: {
      direccion: "Av. Alem 123, Bahía Blanca",
      latitud: -38.7191,
      longitud: -62.2652
    },
    destino: {
      direccion: "Zapiola 456, Bahía Blanca",
      latitud: -38.7021,
      longitud: -62.2801
    }
  };

  return NextResponse.json(mockResponse, { status: 201 });
}