import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function registrarConductor(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

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

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { role: "driver" },
  });

  redirect("/");
}