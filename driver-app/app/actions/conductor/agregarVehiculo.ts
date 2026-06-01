"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const vehiculoSchema = z.object({
  patente: z.string().regex(/^([a-zA-Z]{3}\d{3}|[a-zA-Z]{2}\d{3}[a-zA-Z]{2})$/, "La patente debe tener formato argentino (ej: AAA123 o AA123AA)").transform((val) => val.toUpperCase()),
  numero_poliza: z.string().regex(/^[a-zA-Z0-9\-]{6,25}$/, "El número de póliza debe tener entre 6 y 25 caracteres alfanuméricos o guiones").transform((val) => val.toUpperCase()),
  marca: z.string().min(1, "La marca es requerida"),
  modelo: z.string().min(1, "El modelo es requerido"),
  anio: z.coerce.number().int().min(1990).max(new Date().getFullYear() + 1),
  color: z.string().default("No especificado"),
});

export async function agregarVehiculo(formData: FormData) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "No autorizado" };
  }

  const parseResult = vehiculoSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parseResult.success) {
    return { success: false, error: parseResult.error.issues[0].message };
  }

  const { patente, numero_poliza, marca, modelo, anio, color } = parseResult.data;

  try {
    const conductor = await prisma.conductor.findUnique({
      where: { id_conductor: userId },
    });

    if (!conductor || !conductor.isActive) {
      return { success: false, error: "Conductor no encontrado o inactivo" };
    }

    const vehiculoExistente = await prisma.vehiculo.findUnique({
      where: { patente },
    });

    if (vehiculoExistente) {
      if (vehiculoExistente.id_conductor === userId) {
        if (!vehiculoExistente.isActive) {
          const polizaExistente = await prisma.vehiculo.findUnique({
            where: { numero_poliza }
          });
          if (polizaExistente && polizaExistente.id_vehiculo !== vehiculoExistente.id_vehiculo) {
            return { success: false, error: "El número de póliza ingresado ya pertenece a otro vehículo en el sistema." };
          }
          await prisma.vehiculo.update({
            where: { id_vehiculo: vehiculoExistente.id_vehiculo },
            data: {
              isActive: true,
              fecha_baja: null,
              numero_poliza,
              marca,
              modelo,
              anio,
              color,
            },
          });
          revalidatePath("/perfil");
          return { success: true };
        } else {
          return { success: false, error: "Ya tienes este vehículo registrado y activo." };
        }
      } else {
        return { success: false, error: "La patente ingresada ya se encuentra registrada por otro conductor." };
      }
    }

    const polizaExistente = await prisma.vehiculo.findUnique({
      where: { numero_poliza }
    });
    if (polizaExistente) {
      return { success: false, error: "El número de póliza ingresado ya pertenece a otro vehículo en el sistema." };
    }

    await prisma.vehiculo.create({
      data: {
        id_conductor: userId,
        patente,
        numero_poliza,
        marca,
        modelo,
        anio,
        color,
        isActive: true,
      },
    });

    revalidatePath("/perfil");
    return { success: true };
  } catch (error: any) {
    if (error?.code === "P2002") {
      return { success: false, error: "La patente ingresada ya se encuentra registrada en el sistema." };
    }
    return { success: false, error: "Ocurrió un error inesperado al registrar el vehículo." };
  }
}
