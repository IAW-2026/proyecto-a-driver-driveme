// app/historial/page.tsx
import { redirect } from "next/navigation";
import { getSessionData } from "@/lib/getSessionData";
import prisma from "@/lib/prisma";
import Sidebar from "@/app/components/Nav"; 
import ThemeToggle from "@/app/components/ThemeToggle";
import HeaderModulo from "@/app/components/HeaderModulo";
import EstadoVacio from "@/app/components/EstadoVacio";
import StatusBadge from "@/app/components/EtiquetaEstado";
import { Car } from "lucide-react";
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
  const { userId, rol } = await getSessionData();

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
    <div className="flex min-h-screen w-full bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-white font-sans">
      <Sidebar rol="CONDUCTOR_ACTIVO" />

      <main className="flex-1 pt-8 pb-24 md:pb-8 md:pl-72 px-4 md:px-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">

          <HeaderModulo
            titulo="Mis Viajes"
            icono={Car}
            subtitulo={`${totalCount} viaje${totalCount !== 1 ? "s" : ""} registrado${totalCount !== 1 ? "s" : ""}.`}
            acciones={<ThemeToggle />}
          />

          <div className="rounded-2xl border-2 border-zinc-950 bg-white dark:border-zinc-800 shadow-[4px_4px_0px_0px_#09090b] overflow-hidden">
            
            {totalCount === 0 ? (
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/40">
                <EstadoVacio
                  icono={Car}
                  titulo="Todavía no tenés viajes registrados"
                  descripcion="Cuando aceptes y completes recorridos con pasajeros, vas a poder ver el historial detallado acá."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-150">
                  <thead>
                    <tr className="bg-zinc-100 dark:bg-zinc-900 border-b-2 border-zinc-950 dark:border-zinc-700">
                      <th className="p-4 font-black uppercase text-xs tracking-wider">ID Viaje</th>
                      <th className="p-4 font-black uppercase text-xs tracking-wider">Fecha</th>
                      <th className="p-4 font-black uppercase text-xs tracking-wider">Estado</th>
                      <th className="p-4 font-black uppercase text-xs tracking-wider">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-zinc-100 dark:divide-zinc-800">
                    {viajes.map((viaje) => (
                      <tr key={viaje.id_viaje} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="p-4 font-mono text-sm font-medium">
                          {viaje.id_viaje.split("-")[0]}...
                        </td>
                        <td className="p-4 text-sm font-bold text-zinc-600 dark:text-zinc-300">
                          {formatFecha(viaje.creado_en)}
                        </td>
                        <td className="p-4">
                          <StatusBadge estado={viaje.estado_actual} size="sm" />
                        </td>
                        <td className="p-4 font-black text-lg">
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