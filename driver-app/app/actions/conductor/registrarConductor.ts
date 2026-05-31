"use server";

import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function registrarConductor(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  try {
    await prisma.conductor.create({
      data: {
        id_conductor: userId,
        nombre: formData.get("nombre") as string,
        apellido: formData.get("apellido") as string,
        licencia: formData.get("licencia") as string,
        vehiculos: {
          create: {
            patente: (formData.get("patente") as string).toUpperCase(),
            marca: formData.get("marca") as string,
            modelo: formData.get("modelo") as string,
            anio: parseInt(formData.get("anio") as string, 10),
            color: String(formData.get("color") ?? "No especificado"),
          },
        },
      },
    });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      const licencia = formData.get("licencia") as string;
      const patente = (formData.get("patente") as string).toUpperCase();

      const conductorExistente = await prisma.conductor.findUnique({
        where: { licencia }
      });
      if (conductorExistente && !conductorExistente.isActive) {
        if (conductorExistente.motivoBaja === "SUSPENSION_ADMIN") {
          return { success: false, code: "BANNED_DRIVER", licencia };
        }
        return { success: false, code: "REQUIRES_REACTIVATION", licencia };
      }

      const vehiculoExistente = await prisma.vehiculo.findUnique({
        where: { patente },
        include: { conductor: true }
      });
      if (vehiculoExistente && !vehiculoExistente.conductor.isActive) {
        if (vehiculoExistente.conductor.motivoBaja === "SUSPENSION_ADMIN") {
          return { success: false, code: "BANNED_DRIVER", licencia: vehiculoExistente.conductor.licencia };
        }
        return { success: false, code: "REQUIRES_REACTIVATION", licencia: vehiculoExistente.conductor.licencia };
      }

      return { success: false, error: "La licencia o patente ingresada ya se encuentra registrada y activa." };
    }
    return { success: false, error: "Ocurrió un error inesperado al registrar el conductor." };
  }

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { role: "driver" },
  });

  redirect("/");
}