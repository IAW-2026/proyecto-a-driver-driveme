"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { m2mHeaders } from "@/lib/m2m";

const reporteSchema = z.object({
  id_calificacion: z.string(),
  motivo: z.string(),
  descripcion: z.string().optional(),
});

export async function reportarCalificacionAction(data: z.infer<typeof reporteSchema>) {
  try {
    const authResult = await auth();
    const userId = authResult.userId;

    if (!userId) {
      return { success: false, error: "No autorizado. Inicia sesión." };
    }

    const parsed = reporteSchema.parse(data);

    const payload = {
      id_reportante: userId,
      ...parsed,
    };

    const feedbackUrl = process.env.FEEDBACK_APP_URL;
    if (!feedbackUrl) {
      return { success: false, error: "Servicio de feedback no configurado" };
    }

    const res = await fetch(`${feedbackUrl}/api/reportes`, {
      method: "POST",
      headers: m2mHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.warn("[WARNING] Feedback App devolvió error:", res.status, errorData);
      return { success: false, error: "Error al enviar el reporte a la Feedback App" };
    }
    
    const responseData = await res.json().catch(() => ({}));
    return { success: true, data: responseData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Datos inválidos", detalles: error.issues };
    }
    console.error("[ERROR] reportarCalificacionAction:", error);
    return { success: false, error: "Error interno inesperado." };
  }
}
