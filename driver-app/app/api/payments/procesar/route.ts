// app/api/payments/procesar/route.ts
import { NextResponse } from 'next/server';
import { ProcesarCobroRequest, ProcesarCobroResponse } from '@/app/types/api';

export async function POST(request: Request) {
  const body: ProcesarCobroRequest = await request.json();

  // Simulación de latencia de pasarela de pagos (1.5s)
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const mockResponse: ProcesarCobroResponse = {
    id_transaccion: "tx_" + Math.random().toString(36).substr(2, 9),
    estado: 'CAPTURED'
  };

  return NextResponse.json(mockResponse);
}