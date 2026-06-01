import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_MOCKS !== 'true') {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const idConductor = searchParams.get('id');

  if (!idConductor) {
    return NextResponse.json({ error: "Falta el id del conductor (query param ?id=...)" }, { status: 400 });
  }

  try {
    // Usamos 127.0.0.1 en lugar de localhost para evitar problemas de resolución IPv6 en Node
    const targetUrl = `http://127.0.0.1:3000/api/conductores/${idConductor}/reputacion`;
    
    // Necesitamos enviarle los headers M2M para que no nos rechace por "Unauthorized"
    const internalApiKey = process.env.INTERNAL_API_KEY || '';
    const feedbackToken = process.env.FEEDBACK_APP_TOKEN || '';

    const res = await fetch(targetUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': internalApiKey,
        'Authorization': `Bearer ${feedbackToken}`
      },
      body: JSON.stringify({
        puntaje: 5,
        comentario_promedio: "¡Esta es una reseña simulada desde el Mock de Feedback App!"
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ error: "Falló el PATCH hacia la Driver App", details: errorText }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({
      success: true,
      message: "¡Webhook simulado con éxito! Revisa el perfil del conductor para ver el comentario promedio.",
      driver_app_response: data
    });

  } catch (error: any) {
    return NextResponse.json({ error: "Error de red al intentar simular el webhook", details: error.message }, { status: 500 });
  }
}
