// app/viaje/[id_viaje]/finalizar/page.tsx
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import FinalizarViajeClient from "./FinalizarViajeClient";

interface PageProps {
  params: Promise<{ id_viaje: string }>;
}

export default async function FinalizarViajePage({ params }: PageProps) {
  const { id_viaje } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const viaje = await prisma.viaje.findUnique({
    where: { id_viaje },
  });

  if (!viaje) notFound();
  if (viaje.id_conductor !== userId) redirect("/");

  if (viaje.estado_actual === "FINALIZADO") redirect(`/viaje/${id_viaje}/calificar`);
  if (viaje.estado_actual === "CANCELADO_POR_CONDUCTOR") redirect("/historial");
  if (viaje.estado_actual === "ACEPTADO") redirect(`/viaje/${id_viaje}`);

  return (
    <FinalizarViajeClient
      idViaje={viaje.id_viaje}
      precioFinal={viaje.precio_final}
      metodoPago={viaje.metodo_pago}
      tiempoAceptado={viaje.tiempo_aceptado.toISOString()}
      tiempoComienzo={viaje.tiempo_comienzo?.toISOString() ?? null}
    />
  );
}
