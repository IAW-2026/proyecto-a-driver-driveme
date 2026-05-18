// app/historial/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSessionData } from "@/lib/getSessionData";
import StatusBadge from "@/app/components/StatusBadge";
import Sidebar from "@/app/components/Sidebar";
import ThemeToggle from "@/app/components/ThemeToggle";
import { Car, ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 10;

export const metadata = {
  title: "Historial de Viajes — DriveMe",
  description: "Revisa tu historial de viajes y ganancias.",
};

export default async function HistorialViajes({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { userId, rol } = await getSessionData();

  if (rol === "CONDUCTOR_NUEVO") redirect("/");

  // 1. Configurar Paginación
  const resolvedParams = await searchParams;
  const currentPage = Number(resolvedParams.page) || 1;
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;
  const whereClause = rol === "ADMIN" ? {} : { id_conductor: userId };

  // 2. Consultar a BD (Datos + Total de registros en paralelo)
  const [viajes, totalCount] = await Promise.all([
    prisma.viaje.findMany({
      where: whereClause,
      orderBy: { tiempo_aceptado: "desc" },
      skip: skip,
      take: ITEMS_PER_PAGE,
      include: {
        conductor: true,
        vehiculo: true,
      },
    }),
    prisma.viaje.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="flex min-h-screen w-full bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-white font-sans">
      <Sidebar rol={rol} />

      {/* 1. Cambiamos pt-20 por pt-8 para eliminar el hueco vacío gigante arriba */}
      <main className="flex-1 pt-8 pb-24 md:pb-8 md:pl-72 px-4 md:px-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-4 border-b-4 border-zinc-950 dark:border-zinc-800 pb-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-extrabold uppercase tracking-tight text-zinc-950 dark:text-white">
                {rol === "ADMIN" ? "Historial de la Flota" : "Mis Viajes"}
              </h1>
              <p className="mt-1 font-bold text-zinc-600 dark:text-zinc-400">
                {totalCount} viaje{totalCount !== 1 ? "s" : ""} registrado{totalCount !== 1 ? "s" : ""}.
              </p>
            </div>
            <div className="shrink-0">
              <ThemeToggle />
            </div>
          </div>

          {/* ── Tabla Principal ────────────────────────────────────── */}
          <div className="rounded-2xl border-4 border-zinc-950 bg-white dark:border-brand dark:bg-zinc-900 shadow-[8px_8px_0px_0px_#09090b] dark:shadow-[8px_8px_0px_0px_#CFFF04] overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[580px]">
              <thead>
                <tr className="text-xs md:text-sm bg-zinc-950 text-brand dark:bg-brand dark:text-zinc-950 uppercase tracking-wider">
                  <th className="p-4 font-extrabold whitespace-nowrap">Fecha</th>
                  {rol === "ADMIN" && (
                    <th className="p-4 font-extrabold whitespace-nowrap">Conductor</th>
                  )}
                  <th className="p-4 font-extrabold whitespace-nowrap">Vehículo</th>
                  <th className="p-4 font-extrabold whitespace-nowrap">Precio</th>
                  <th className="p-4 font-extrabold whitespace-nowrap">Método</th>
                  <th className="p-4 font-extrabold text-center whitespace-nowrap">Estado</th>
                </tr>
              </thead>
              <tbody>
                {viajes.map((viaje) => (
                  <tr
                    key={viaje.id_viaje}
                    className="border-b-2 border-zinc-950 dark:border-zinc-800 last:border-b-0 hover:bg-brand/10 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <td className="p-4 text-sm font-bold whitespace-nowrap text-zinc-950 dark:text-white">
                      {new Date(viaje.tiempo_aceptado).toLocaleDateString("es-AR", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                      <span className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-0.5">
                        {new Date(viaje.tiempo_aceptado).toLocaleTimeString("es-AR", {
                          hour: "2-digit", minute: "2-digit",
                        })} hs
                      </span>
                    </td>

                    {rol === "ADMIN" && (
                      <td className="p-4 text-sm font-bold whitespace-nowrap text-zinc-950 dark:text-white">
                        {viaje.conductor.nombre} {viaje.conductor.apellido}
                      </td>
                    )}

                    <td className="p-4 whitespace-nowrap">
                      <p className="text-sm font-bold text-zinc-950 dark:text-white uppercase">
                        {viaje.vehiculo.marca} {viaje.vehiculo.modelo}
                      </p>
                      <p className="text-xs font-mono font-medium text-zinc-600 dark:text-zinc-400 mt-0.5">
                        {viaje.vehiculo.patente}
                      </p>
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <span className="text-lg font-extrabold text-zinc-950 dark:text-white">
                        {(viaje.precio_final > 0 ? viaje.precio_final : viaje.precio) > 0
                          ? `$${(viaje.precio_final || viaje.precio).toLocaleString("es-AR")}`
                          : "—"}
                      </span>
                    </td>

                    <td className="p-4 text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                      {viaje.metodo_pago}
                    </td>

                    <td className="p-4 text-center whitespace-nowrap">
                      <StatusBadge estado={viaje.estado_actual} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {viajes.length === 0 && (
              <div className="p-16 flex flex-col items-center justify-center text-center text-zinc-600 dark:text-zinc-400">
                <Car className="w-16 h-16 mb-4 text-zinc-400 dark:text-zinc-600" strokeWidth={2} />
                <p className="text-xl font-extrabold text-zinc-950 dark:text-white uppercase tracking-tight">
                  No hay viajes registrados
                </p>
                <p className="mt-2 font-medium">Tus viajes completados o cancelados aparecerán aquí.</p>
              </div>
            )}
          </div>

          {/* ── Controles de Paginación ────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white dark:bg-zinc-900 border-4 border-zinc-950 dark:border-zinc-800 p-4 rounded-2xl shadow-[6px_6px_0px_0px_#09090b] dark:shadow-none">
              <p className="text-sm font-extrabold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider hidden md:block">
                Página {currentPage} de {totalPages}
              </p>

              <div className="flex gap-4 w-full md:w-auto justify-between">
                {currentPage > 1 ? (
                  <Link
                    href={`/historial?page=${currentPage - 1}`}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-950 border-2 border-zinc-950 dark:border-brand font-bold rounded-xl shadow-[4px_4px_0px_0px_#09090b] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#09090b] dark:shadow-[4px_4px_0px_0px_#CFFF04] dark:hover:shadow-[6px_6px_0px_0px_#CFFF04] transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" strokeWidth={3} /> Anterior
                  </Link>
                ) : (
                  <span className="flex items-center gap-2 px-4 py-2 bg-zinc-200 dark:bg-zinc-800 border-2 border-zinc-400 dark:border-zinc-700 text-zinc-500 rounded-xl font-bold opacity-50 cursor-not-allowed">
                    <ChevronLeft className="w-5 h-5" strokeWidth={3} /> Anterior
                  </span>
                )}

                {currentPage < totalPages ? (
                  <Link
                    href={`/historial?page=${currentPage + 1}`}
                    className="flex items-center gap-2 px-4 py-2 bg-brand border-2 border-zinc-950 text-zinc-950 font-bold rounded-xl shadow-[4px_4px_0px_0px_#09090b] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#09090b] dark:border-brand dark:shadow-[4px_4px_0px_0px_#CFFF04] dark:hover:shadow-[6px_6px_0px_0px_#CFFF04] transition-all"
                  >
                    Siguiente <ChevronRight className="w-5 h-5" strokeWidth={3} />
                  </Link>
                ) : (
                  <span className="flex items-center gap-2 px-4 py-2 bg-zinc-200 dark:bg-zinc-800 border-2 border-zinc-400 dark:border-zinc-700 text-zinc-500 rounded-xl font-bold opacity-50 cursor-not-allowed">
                    Siguiente <ChevronRight className="w-5 h-5" strokeWidth={3} />
                  </span>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}