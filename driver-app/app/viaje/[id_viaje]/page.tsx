// app/viaje/[id_viaje]/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import ViajeEnCursoClient from "./ViajeEnCursoClient";

interface PageProps {
  params: Promise<{ id_viaje: string }>;
}

export default async function ViajeEnCursoPage({ params }: PageProps) {
  const { id_viaje } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const viaje = await prisma.viaje.findUnique({
    where: { id_viaje },
    include: { conductor: true },
  });

  if (!viaje) redirect("/historial");
  if (viaje.id_conductor !== userId) redirect("/");

  if (viaje.estado_actual === "FINALIZADO" || viaje.estado_actual === "CANCELADO_POR_CONDUCTOR") {
    redirect("/historial");
  }

  return (
    <ViajeEnCursoClient
      viaje={{
        id: viaje.id_viaje,
        estado_actual: viaje.estado_actual,
        id_pasajero: viaje.id_pasajero ?? "",
        precio_final: viaje.precio_final,
        metodo_pago: viaje.metodo_pago,
        pasajero: { nombre: viaje.pasajero_nombre ?? "Pasajero" },
        origen: {
          direccion: viaje.origen_direccion ?? "Origen",
          latitud: viaje.origen_latitud ?? 0,
          longitud: viaje.origen_longitud ?? 0
        },
        destino: {
          direccion: viaje.destino_direccion ?? "Destino",
          latitud: viaje.destino_latitud ?? 0,
          longitud: viaje.destino_longitud ?? 0
        }
      }}
      conductorId={userId}
      conductorLat={viaje.conductor.latitud_actual ?? -38.7183}
      conductorLng={viaje.conductor.longitud_actual ?? -62.2664}
    />
  );
}
