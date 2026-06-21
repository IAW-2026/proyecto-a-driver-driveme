import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAdminM2M } from "@/lib/m2m";
import { handleError } from "@/lib/api-utils";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!validateAdminM2M(request, "control-plane")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const viaje = await prisma.viaje.findUnique({
      where: { id_viaje: id },
    });

    if (!viaje) {
      return NextResponse.json({ error: "Viaje no encontrado" }, { status: 404 });
    }

    if (viaje.estado_actual !== "EN_CURSO" && viaje.estado_actual !== "ACEPTADO") {
      return NextResponse.json({ error: "Solo se pueden cancelar viajes en curso o aceptados" }, { status: 400 });
    }

    // Actualizar el viaje a CANCELADO
    const viajeActualizado = await prisma.viaje.update({
      where: { id_viaje: id },
      data: { 
        estado_actual: "CANCELADO_POR_CONDUCTOR",
        estado: "CANCELADO_POR_CONDUCTOR" // el campo string base
      },
    });

    // Liberar al conductor (pasarlo a ONLINE)
    await prisma.conductor.update({
      where: { id_conductor: viaje.id_conductor },
      data: { estado: "ONLINE" },
    });

    return NextResponse.json({ success: true, viaje: viajeActualizado }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}
