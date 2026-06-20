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

    const conductor = await prisma.conductor.update({
      where: { id_conductor: id },
      data: { isActive },
    });

    return NextResponse.json({ success: true, conductor }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}
