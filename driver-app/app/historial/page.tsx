// app/historial/page.tsx
import { redirect } from "next/navigation";
import { getSessionData } from "@/lib/getSessionData";
import { checkActiveRideRedirect } from "@/lib/checkActiveRide";
import prisma from "@/lib/prisma";
import Sidebar from "@/app/components/Nav"; 
import HeaderModulo from "@/app/components/HeaderModulo";
import EstadoVacio from "@/app/components/EstadoVacio";
import StatusBadge from "@/app/components/EtiquetaEstado";
import { CarFront } from "lucide-react";
import { formatARS, formatFecha } from "@/lib/formatters";
import PaginadorURL from "@/app/components/admin/PaginadorURL"; 

export const metadata = {
  title: "Mis Viajes — DriveMe Conductores",
  description: "Historial completo de tus viajes realizados.",
};

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { userId, rol, conductorData } = await getSessionData();
  await checkActiveRideRedirect(conductorData);

  if (rol === "ADMIN" || rol === "CONDUCTOR_NUEVO") {
    redirect("/");
  }

  const ITEMS_POR_PAGINA = 10;
  const params = await searchParams;
  const currentPage = Number(params?.page) || 1; 
  const skip = (currentPage - 1) * ITEMS_POR_PAGINA; 

  const viajes = await prisma.viaje.findMany({
    where: { id_conductor: userId },
    orderBy: { creado_en: "desc" },
    skip: skip,
    take: ITEMS_POR_PAGINA,
    include: {
      vehiculo: true,
    },
  });

  const totalCount = await prisma.viaje.count({
    where: { id_conductor: userId },
  });
  const totalPages = Math.ceil(totalCount / ITEMS_POR_PAGINA);

  return (
    <div className="flex min-h-screen w-full font-sans">
      <Sidebar rol="CONDUCTOR_ACTIVO" nombre={undefined} />

      <main className="flex-1 pt-8 md:pt-28 pb-24 md:pb-8 px-4 md:px-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">

          <HeaderModulo
            titulo="Mis Viajes"
            icono={CarFront}
            subtitulo={`${totalCount} viaje${totalCount !== 1 ? "s" : ""} registrado${totalCount !== 1 ? "s" : ""}.`}
          />

          <div className="rounded-modal border border-[rgba(220,38,38,0.25)] bg-[rgba(10,10,10,0.7)] backdrop-blur-md shadow-[0_0_30px_rgba(220,38,38,0.1)] overflow-hidden">
            
            {totalCount === 0 ? (
              <div className="p-4 bg-[rgba(10,10,10,0.5)]">
                <EstadoVacio
                  icono={CarFront}
                  titulo="Todavía no tenés viajes registrados"
                  descripcion="Cuando aceptes y completes recorridos con pasajeros, vas a poder ver el historial detallado acá."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]" aria-label="Historial de viajes">
                  <thead>
                    <tr className="bg-[#0A0A0A] border-b border-[rgba(220,38,38,0.15)]">
                      <th className="p-4 font-bold text-[#9CA3AF] uppercase text-xs tracking-[0.2em]">ID Viaje</th>
                      <th className="p-4 font-bold text-[#9CA3AF] uppercase text-xs tracking-[0.2em]">Fecha</th>
                      <th className="p-4 font-bold text-[#9CA3AF] uppercase text-xs tracking-[0.2em]">Estado</th>
                      <th className="p-4 font-bold text-[#9CA3AF] uppercase text-xs tracking-[0.2em]">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
                    {viajes.map((viaje) => (
                      <tr key={viaje.id_viaje} className="hover:bg-[#1F1F1F] transition-colors">
                        <td className="p-4 font-mono text-sm font-medium text-[#E5E7EB]">
                          {viaje.id_viaje.split("-")[0]}...
                        </td>
                        <td className="p-4 text-sm font-bold text-white">
                          {formatFecha(viaje.creado_en)}
                        </td>
                        <td className="p-4">
                          <StatusBadge estado={viaje.estado_actual} size="sm" />
                        </td>
                        <td className="p-4 font-black text-lg text-primary drop-shadow-[0_0_5px_rgba(220,38,38,0.3)]">
                          {formatARS(viaje.precio_final > 0 ? viaje.precio_final : viaje.precio)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* --- CONTROLES DE PAGINACIÓN --- */}
          {totalPages > 1 && (
            <PaginadorURL 
              paginaActual={currentPage} 
              totalPaginas={totalPages} 
            />
          )}

        </div>
      </main>
    </div>
  );
}