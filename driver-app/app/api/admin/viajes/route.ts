import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAdminM2M } from "@/lib/m2m";
import { handleError } from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    if (!validateAdminM2M(request, "control-plane")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const [viajes, total] = await Promise.all([
      prisma.viaje.findMany({
        skip,
        take: limit,
        orderBy: { creado_en: "desc" },
        include: {
          conductor: { select: { id_conductor: true, nombre: true, apellido: true } },
          vehiculo: { select: { id_vehiculo: true, marca: true, modelo: true, patente: true } },
        },
      }),
      prisma.viaje.count(),
    ]);

    return NextResponse.json({ viajes, total }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}
