// app/actions/conductor/sugerirZonas.ts
"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { unstable_cache } from "next/cache";

// 1. Zod Schema para validación del output del LLM
const SugerenciaSchema = z.object({
  suggestedZones: z.array(
    z.object({
      zoneName: z.string(),
      reason: z.string(),
    })
  ),
  confidenceScore: z.number().min(0).max(100),
});

export type SugerenciaIA = z.infer<typeof SugerenciaSchema>;

// Función auxiliar para obtener las sugerencias con caché
const obtenerSugerenciasCacheadas = async (conductorId: string) => {
  const getCachedData = unstable_cache(
    async () => {
      // A. Obtener los últimos 100 viajes exitosos del conductor
      const viajes = await prisma.viaje.findMany({
        where: {
          id_conductor: conductorId,
          estado_actual: "FINALIZADO",
        },
        orderBy: {
          tiempo_completado: "desc",
        },
        take: 100,
        select: {
          destino_direccion: true,
        },
      });

      // B. Preprocesamiento: Agrupación básica
      if (viajes.length === 0) {
        return {
          suggestedZones: [
            {
              zoneName: "Zonas Céntricas / Alta Actividad",
              reason: "Como aún no tienes viajes registrados, te sugerimos iniciar tu jornada en el centro de la ciudad para maximizar tus oportunidades.",
            },
          ],
          confidenceScore: 50,
        };
      }

      const conteoZonas = viajes.reduce((acc, viaje) => {
        const zona = viaje.destino_direccion?.split(",")[0]?.trim() || "Zona Desconocida";
        acc[zona] = (acc[zona] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topZonas = Object.entries(conteoZonas)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([zona, count]) => ({ zona, count }));

      // C. Prompt para el LLM
      const prompt = `
  Eres un asistente experto para conductores de DriveMe.
  Analiza estos destinos frecuentes: ${JSON.stringify(topZonas)}.
  
  REGLAS ESTRICTAS:
  1. Devuelve ÚNICAMENTE un objeto JSON.
  2. NO incluyas formato Markdown, ni bloques de código json, ni texto introductorio.
  3. El objeto debe seguir este esquema exacto:
     {
       "suggestedZones": [{ "zoneName": "string", "reason": "string" }],
       "confidenceScore": number
     }
`;

      // D. Llamada a Groq (Compatible con OpenAI SDK)
      const apiKey = process.env.GROQ_API_KEY;

      if (!apiKey) {
        console.warn("⚠️ GROQ_API_KEY no configurada. Retornando fallback.");
        return {
          suggestedZones: topZonas.slice(0, 3).map((z) => ({
            zoneName: z.zona,
            reason: `Zona con ${z.count} visitas recientes. ¡Sigue así!`,
          })),
          confidenceScore: 80,
        };
      }

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant", // Modelo actualizado (llama3-8b-8192 fue descontinuado)
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Groq API Error:", errText);
        throw new Error(`Error en la respuesta de Groq: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const llmOutput = data.choices[0].message.content;

      // E. Validación de esquema con Zod
      const parsedData = JSON.parse(llmOutput);
      return SugerenciaSchema.parse(parsedData);
    },
    ["sugerencias-ia-conductor", conductorId],
    {
      revalidate: 1800, // Caché de 30 minutos
      tags: [`sugerencias-${conductorId}`],
    }
  );

  return getCachedData();
};

export async function sugerirZonasAction() {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "No autorizado." };

    const sugerencias = await obtenerSugerenciasCacheadas(userId);
    return { success: true, data: sugerencias };
  } catch (error) {
    console.error("Error en sugerirZonasAction:", error);
    return { success: false, error: "Error al obtener sugerencias." };
  }
}