import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAdminM2M } from "@/lib/m2m";
import { handleError } from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    if (!validateAdminM2M(request, "analytics")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalConductores,
      conductoresActivos,
      conductoresDisponibles,
      conductoresOcupados,
      totalViajes,
      ingresosBrutosData,
      viajesCancelados,
      viajesEnCurso,
      viajesAceptados
    ] = await Promise.all([
      prisma.conductor.count(),
      prisma.conductor.count({ where: { isActive: true } }),
      prisma.conductor.count({ where: { estado: "ONLINE", isActive: true } }),
      prisma.conductor.count({ where: { estado: "OCUPADO", isActive: true } }),
      prisma.viaje.count({ where: { estado_actual: "FINALIZADO" } }),
      prisma.viaje.aggregate({
        _sum: { precio_final: true },
        where: { estado_actual: "FINALIZADO" }
      }),
      prisma.viaje.count({ where: { estado_actual: "CANCELADO_POR_CONDUCTOR" } }),
      prisma.viaje.count({ where: { estado_actual: "EN_CURSO" } }),
      prisma.viaje.count({ where: { estado_actual: "ACEPTADO" } })
    ]);

    const metricas = {
      totalConductores,
      conductoresActivos,
      conductoresDisponibles,
      conductoresOcupados,
      totalViajesCompletados: totalViajes,
      viajesCancelados,
      viajesEnCurso,
      viajesAceptados,
      ingresosBrutos: ingresosBrutosData._sum.precio_final || 0
    };

    return NextResponse.json({ success: true, metricas }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}
