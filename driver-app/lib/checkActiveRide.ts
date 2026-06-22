import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

import { EstadoViaje } from "@/app/generated/prisma/client";

export async function checkActiveRideRedirect(conductorData: any) {
  if (conductorData?.estado === "OCUPADO") {
    const activeViaje = await prisma.viaje.findFirst({
      where: {
        id_conductor: conductorData.id_conductor,
        estado_actual: { in: [EstadoViaje.ACEPTADO, EstadoViaje.EN_CURSO] }
      }
    });

    if (activeViaje) {
      redirect(`/viaje/${activeViaje.id_viaje}`);
    } else {
      // Auto-heal if the database state is out of sync
      await prisma.conductor.update({
        where: { id_conductor: conductorData.id_conductor },
        data: { estado: "ONLINE" }
      });
      conductorData.estado = "ONLINE";
    }
  }
}
