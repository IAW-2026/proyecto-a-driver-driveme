"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { m2mHeaders } from "@/lib/m2m";

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
    const token = await authResult.getToken();

    if (!userId || !token) {
      return { success: false, error: "No autorizado. Inicia sesión." };
    }

    const parsed = resenaSchema.parse(data);

    const feedbackUrl = process.env.FEEDBACK_APP_URL;
    if (!feedbackUrl) {
      return { success: false, error: "Servicio de feedback no configurado" };
    }

    const res = await fetch(`${feedbackUrl}/api/resenas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...m2mHeaders()
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Datos inválidos", detalles: error.issues };
    }
    console.error("[ERROR] enviarResenaAction:", error);
    return { success: false, error: "Error interno inesperado." };
  }
}
