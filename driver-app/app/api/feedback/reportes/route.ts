import { NextResponse } from 'next/server';
import { CrearReporteRequest, CrearReporteResponse } from '@/app/types/api';

export async function POST(request: Request) {
  // Extraemos el body para asegurar que la request llega con el formato esperado
  const body: CrearReporteRequest = await request.json();

  // Armamos la respuesta simulada respetando el estado canónico inicial
  const mockResponse: CrearReporteResponse = {
    id_reporte: "rep_" + Math.random().toString(36).substring(2, 11),
    estado: 'PENDIENTE', // El reporte siempre nace en estado PENDIENTE para el moderador
    timestamp: new Date().toISOString()
  };

  // Agregamos un pequeño delay simulado (500ms) por si necesitás testear 
  // el estado de carga (spinner) en el botón de "Enviar Reporte" de tu UI
  await new Promise((resolve) => setTimeout(resolve, 500));

  return NextResponse.json(mockResponse, { status: 201 });
}