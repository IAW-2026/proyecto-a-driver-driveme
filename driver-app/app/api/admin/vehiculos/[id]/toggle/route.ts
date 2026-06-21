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
    const { isActive } = await request.json();

    if (typeof isActive !== "boolean") {
      return NextResponse.json({ error: "El campo isActive debe ser un booleano." }, { status: 400 });
    }

    const vehiculo = await prisma.vehiculo.update({
      where: { id_vehiculo: id },
      data: { isActive },
    });

    // Si inhabilitamos el vehículo, verificamos si el conductor estaba usándolo para conectarse
    if (!isActive) {
      const conductorAfectado = await prisma.conductor.findFirst({
        where: { vehiculo_activo_id: id, estado: { in: ["ONLINE", "OCUPADO"] } }
      });

      if (conductorAfectado) {
        await prisma.conductor.update({
          where: { id_conductor: conductorAfectado.id_conductor },
          data: { 
            estado: "OFFLINE", 
            vehiculo_activo_id: null 
          }
        });
        
        await prisma.historialConexion.create({
          data: {
            id_conductor: conductorAfectado.id_conductor,
            estado: "OFFLINE",
          }
        });
      }
    }

    return NextResponse.json({ success: true, vehiculo }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}
