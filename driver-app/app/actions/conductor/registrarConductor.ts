"use server";

import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const formSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  apellido: z.string().min(1, "El apellido es requerido"),
  licencia: z.string().regex(/^\d{7,8}$/, "El número de licencia debe tener 7 u 8 dígitos numéricos."),
  patente: z.string().regex(/^([a-zA-Z]{3}\d{3}|[a-zA-Z]{2}\d{3}[a-zA-Z]{2})$/, "La patente debe tener formato argentino (ej: AAA123 o AA123AA)").transform((val) => val.toUpperCase()),
  numero_poliza: z.string().regex(/^[a-zA-Z0-9\-]{6,25}$/, "El número de póliza debe tener entre 6 y 25 caracteres alfanuméricos o guiones").transform((val) => val.toUpperCase()),
  marca: z.string().min(1, "La marca es requerida"),
  modelo: z.string().min(1, "El modelo es requerido"),
  anio: z.coerce.number().int().min(1990).max(new Date().getFullYear() + 1),
  color: z.string().default("No especificado"),
});

export async function registrarConductor(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const parseResult = formSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parseResult.success) {
    return { success: false, error: parseResult.error.issues[0].message };
  }

  const { nombre, apellido, licencia, patente, numero_poliza, marca, modelo, anio, color } = parseResult.data;

  try {
    await prisma.conductor.create({
      data: {
        id_conductor: userId,
        nombre,
        apellido,
        licencia,
        vehiculos: {
          create: {
            patente,
            numero_poliza,
            marca,
            modelo,
            anio,
            color,
          },
        },
      },
    });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      // 1. Revisar si falló por la licencia (conductor existente)
      const conductorExistente = await prisma.conductor.findUnique({
        where: { licencia }
      });

      if (conductorExistente) {
        if (!conductorExistente.isActive) {
          if (conductorExistente.motivoBaja === "SUSPENSION_ADMIN") {
            return { success: false, code: "BANNED_DRIVER", licencia };
          }
          // Solo sugerimos reactivar si coincide la licencia inactiva
          return { success: false, code: "REQUIRES_REACTIVATION", licencia };
        } else {
          return { success: false, error: "La licencia ingresada ya se encuentra registrada y activa." };
        }
      }

      // 2. Si no falló por licencia, debió fallar por patente.
      return { success: false, error: "La patente ingresada ya se encuentra registrada." };
    }
    return { success: false, error: "Ocurrió un error inesperado al registrar el conductor." };
  }

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { role: "driver" },
  });

  redirect("/");
}