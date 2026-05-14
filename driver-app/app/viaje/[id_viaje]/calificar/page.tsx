// app/viaje/[id_viaje]/calificar/page.tsx
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import CalificarPasajeroClient from "./CalificarPasajeroClient";

interface PageProps {
  params: Promise<{ id_viaje: string }>;
}

export default async function CalificarPasajeroPage({ params }: PageProps) {
  const { id_viaje } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const viaje = await prisma.viaje.findUnique({
    where: { id_viaje },
  });

  if (!viaje) notFound();
  if (viaje.id_conductor !== userId) redirect("/");

  if (viaje.estado_actual !== "FINALIZADO") {
    redirect(`/viaje/${id_viaje}`);
  }

  return (
    <CalificarPasajeroClient
      idViaje={viaje.id_viaje}
      idConductor={userId}
      idPasajero={viaje.id_pasajero ?? ""}
    />
  );
}
