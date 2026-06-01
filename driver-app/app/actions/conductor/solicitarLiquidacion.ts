"use server";

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function solicitarLiquidacionAction() {
  try {
    const authResult = await auth();
    const token = await authResult.getToken();
    const userId = authResult.userId;

    if (!userId || !token) {
      return { success: false, error: "No autorizado. Inicia sesión." };
    }

    // 1. Obtener la fecha de la última liquidación
    const conductor = await prisma.conductor.findUnique({
      where: { id_conductor: userId },
      select: { fecha_ultima_liquidacion: true }
    });

    if (!conductor) {
      return { success: false, error: "Conductor no encontrado." };
    }

    // 2. Controlar la regla de "Una vez por semana"
    if (conductor.fecha_ultima_liquidacion) {
      const ahora = new Date();
      const ultima = new Date(conductor.fecha_ultima_liquidacion);
      const diffDias = (ahora.getTime() - ultima.getTime()) / (1000 * 3600 * 24);

      if (diffDias < 7) {
        const diasFaltantes = Math.ceil(7 - diffDias);
        return {
          success: false,
          error: `Solo podés solicitar una liquidación cada 7 días. Faltan ${diasFaltantes} día(s).`
        };
      }
    }

    // 3. Llamar al endpoint de Payments App con JWT del conductor (Bearer token)
    // Documentación: POST /api/pagos/liquidaciones — Autenticación: Bearer JWT (Clerk, rol DRIVER)
    // El conductor se identifica por su JWT, no hace falta enviar body.
    const baseUrl = process.env.PAYMENTS_APP_URL;
    if (!baseUrl) {
      console.warn("⚠️ PAYMENTS_APP_URL no configurada.");
      return { success: false, error: "Error de configuración de entorno." };
    }

    const response = await fetch(`${baseUrl}/api/pagos/liquidaciones`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      // El contrato no requiere body — el conductor se identifica por JWT
    });

    if (!response.ok) {
      if (response.status === 422) {
        return { success: false, error: "No tenés saldo ni transacciones pendientes para liquidar." };
      }

      const errorText = await response.text();
      console.error("Error desde Payments App:", response.status, errorText);
      return { success: false, error: "Error al comunicarse con el sistema de pagos." };
    }

    const data = await response.json();

    // 4. Si es exitoso, actualizamos la fecha localmente
    await prisma.conductor.update({
      where: { id_conductor: userId },
      data: { fecha_ultima_liquidacion: new Date() }
    });

    // 5. Revalidar para que la billetera actualice saldo e historial
    revalidatePath("/billetera");

    return {
      success: true,
      data: {
        montoPagado: data.monto_pagado,
        idLiquidacion: data.id_liquidacion,
        estado: data.estado
      }
    };

  } catch (error) {
    console.error("Error en solicitarLiquidacionAction:", error);
    return { success: false, error: "Ocurrió un error inesperado al procesar la liquidación." };
  }
}
