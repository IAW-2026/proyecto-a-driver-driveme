"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

const resenaSchema = z.object({
  id_viaje: z.string(),
  id_emisor: z.string(),
  id_receptor: z.string(),
  puntaje: z.number().min(1).max(5),
  comentario: z.string().optional(),
});

export async function enviarResenaAction(data: z.infer<typeof resenaSchema>) {
  try {
    const authResult = await auth();
    const userId = authResult.userId;

    if (!userId) {
      return { success: false, error: "No autorizado. Inicia sesión." };
    }

    const parsed = resenaSchema.parse(data);

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

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.warn("[WARNING] Feedback App devolvió error:", res.status, errorData);
        return { success: false, error: "Error al enviar reseña a la Feedback App" };
      }
      
      const responseData = await res.json().catch(() => ({}));
      return { success: true, data: responseData };
    }

    // Mock local: registrar en consola y responder OK
    console.log(`[RESEÑA MOCK] Conductor ${parsed.id_emisor} calificó pasajero ${parsed.id_receptor} con ${parsed.puntaje}★ en viaje ${parsed.id_viaje}`);
    if (parsed.comentario && parsed.comentario !== "Sin comentario.") {
      console.log(`  Comentario: "${parsed.comentario}"`);
    }

    return {
      success: true,
      data: {
        id_resena: `resena_mock_${Date.now()}`,
        ...parsed,
        creado_en: new Date().toISOString(),
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Datos inválidos", detalles: error.issues };
    }
    console.error("[ERROR] enviarResenaAction:", error);
    return { success: false, error: "Error interno inesperado." };
  }
}
