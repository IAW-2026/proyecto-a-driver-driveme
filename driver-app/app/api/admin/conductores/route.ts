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
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    const [conductores, total] = await Promise.all([
      prisma.conductor.findMany({
        skip,
        take: limit,
        include: { vehiculos: true },
        orderBy: { fecha_alta: "desc" }
      }),
      prisma.conductor.count()
    ]);

    return NextResponse.json(
      { success: true, conductores, total, page, limit },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}
