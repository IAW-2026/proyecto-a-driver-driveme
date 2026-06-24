"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth} from "@clerk/nextjs/server";
import { m2mHeaders } from "@/lib/m2m";
import { revalidateTag } from 'next/cache';

export async function finalizarViaje(id_viaje: string) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "No autorizado" };

  try {
    const viaje = await prisma.viaje.findUnique({ where: { id_viaje } });
    if (!viaje) return { success: false, error: "Viaje no encontrado" };
    if (viaje.id_conductor !== userId) return { success: false, error: "No sos el conductor de este viaje" };
    if (viaje.estado_actual === "FINALIZADO") return { success: false, error: "El viaje ya fue finalizado" };

    // 1. Marcar FINALIZADO en la BD local
    await prisma.viaje.update({
      where: { id_viaje },
      data: {
        estado_actual: "FINALIZADO",
        tiempo_completado: new Date(),
      },
    });

    // 2. Liberar al conductor → ONLINE
    await prisma.conductor.update({
      where: { id_conductor: userId },
      data: { estado: "ONLINE" },
    });

    // 3. Registrar el pase automático a ONLINE en el historial
    await prisma.historialConexion.create({
      data: {
        id_conductor: userId,
        estado: "ONLINE",
      },
    });

    // 4. Procesar cobro via Payments App — M2M (spec B)
    const paymentsUrl = process.env.PAYMENTS_APP_URL;
    let idTransaccion: string | null = null;

    if (paymentsUrl) {
      const isMockTrip = viaje.id_solicitud?.startsWith("mock-");

      try {
        if (isMockTrip) {
          // Para viajes mock: la Rider App nunca creó la transacción, así que
          // la creamos nosotros (POST, spec A) antes de confirmarla (PUT, spec B).
          // POST requiere DRIVER_SERVICE_SECRET (la Payments App acepta tokens de servicios conocidos).
          const createRes = await fetch(`${paymentsUrl}/api/pagos/transacciones`, {
            method: "POST",
            headers: m2mHeaders(),
            body: JSON.stringify({
              id_viaje,
              id_pasajero: viaje.id_pasajero,
              id_conductor: userId,
              metodo_pago: viaje.metodo_pago || "EFECTIVO",
              monto: Number(viaje.precio_final ?? viaje.precio ?? 0),
            }),
          });

          if (createRes.ok) {
            const createData = await createRes.json();
            idTransaccion = createData.id_transaccion ?? null;
            console.log(`[MOCK] Transacción creada en Payments: ${idTransaccion}`);
          } else {
            const errorText = await createRes.text().catch(() => "");
            console.warn(`[WARNING] Payments App POST devolvió ${createRes.status}: ${errorText}`);
          }
        }

        // PUT para confirmar la transacción (spec B: DRIVER_SERVICE_SECRET)
        // Para viajes reales: la Rider App ya creó la transacción con id = id_viaje
        // Para viajes mock: usamos el id_transaccion devuelto por el POST anterior
        const txnId = idTransaccion ?? id_viaje;
        const confirmRes = await fetch(`${paymentsUrl}/api/pagos/transacciones`, {
          method: "PUT",
          headers: m2mHeaders(),
          body: JSON.stringify({
            id_transaccion: txnId,
          }),
        });

        if (confirmRes.ok) {
          const confirmData = await confirmRes.json();
          idTransaccion = confirmData.id_transaccion ?? txnId;
          console.log(`[OK] Transacción ${idTransaccion} confirmada en Payments.`);
        } else {
          const errorText = await confirmRes.text().catch(() => "");
          console.warn(`[WARNING] Payments App PUT devolvió ${confirmRes.status}: ${errorText}`);
        }
      } catch (e) {
        console.warn("[WARNING] Payments App inalcanzable.", e);
      }
    }

    // 5. Notificar a Rider App — M2M (DRIVER_SERVICE_SECRET)
    try {
      await fetch(
        `${process.env.RIDER_APP_URL}/api/notificaciones/viajes/${id_viaje}/estado`,
        {
          method: "POST",
          headers: m2mHeaders(),
          body: JSON.stringify({
            id_viaje,
            id_pasajero: viaje.id_pasajero,
            estado_actual: "FINALIZADO",
            fuente: "DRIVER_APP",
          }),
        }
      );
    } catch {
      console.warn("[WARNING] Rider App inalcanzable al notificar finalización.");
    }


    revalidatePath("/");
    revalidateTag(`sugerencias-${userId}`, "default");
    return { success: true, id_transaccion: idTransaccion, precio_final: viaje.precio_final };
  } catch (error) {
    console.error("Error al finalizar viaje:", error);
    return { success: false, error: String(error) };
  }
}