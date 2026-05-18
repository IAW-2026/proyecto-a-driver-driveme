/**
 * app/api/resenas/route.ts
 * -----------------------------------------------------------------------
 * Endpoint local para recibir calificaciones del conductor al pasajero.
 * En producción, esto se reenviaría a la Feedback App real.
 * En desarrollo local (sin FEEDBACK_APP_URL configurada), este endpoint
 * actúa como mock y acepta la calificación directamente.
 * -----------------------------------------------------------------------
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

const resenaSchema = z.object({
  id_viaje: z.string(),
  id_emisor: z.string(),
  id_receptor: z.string(),
  puntaje: z.number().min(1).max(5),
  comentario: z.string().optional(),
});

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = resenaSchema.parse(body);

    // Si hay una Feedback App configurada, reenviar allá
    const feedbackUrl = process.env.FEEDBACK_APP_URL;
    if (feedbackUrl) {
      const internalApiKey = process.env.INTERNAL_API_KEY;
      const res = await fetch(`${feedbackUrl}/api/resenas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(internalApiKey ? { "x-api-key": internalApiKey } : {}),
        },
        body: JSON.stringify(parsed),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.warn("[WARNING] Feedback App devolvió error:", res.status, data);
        return NextResponse.json(
          { error: "Error al enviar reseña a la Feedback App" },
          { status: res.status }
        );
      }
      return NextResponse.json({ success: true, data });
    }

    // Mock local: registrar en consola y responder OK
    console.log(`[RESEÑA MOCK] Conductor ${parsed.id_emisor} calificó pasajero ${parsed.id_receptor} con ${parsed.puntaje}★ en viaje ${parsed.id_viaje}`);
    if (parsed.comentario && parsed.comentario !== "Sin comentario.") {
      console.log(`  Comentario: "${parsed.comentario}"`);
    }

    return NextResponse.json({
      success: true,
      data: {
        id_resena: `resena_mock_${Date.now()}`,
        ...parsed,
        creado_en: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: error.issues },
        { status: 400 }
      );
    }
    console.error("[ERROR] /api/resenas:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
