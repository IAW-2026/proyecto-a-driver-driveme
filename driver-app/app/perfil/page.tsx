// app/perfil/page.tsx
// Server Component — Perfil del conductor con calificaciones de la Feedback App.
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionData } from "@/lib/getSessionData";
import Sidebar from "@/app/components/Nav";
import ThemeToggle from "@/app/components/ThemeToggle";
import HeaderModulo from "@/app/components/HeaderModulo";
import EstadoVacio from "@/app/components/EstadoVacio";
import { Car, Star, StarOff, ChevronLeft, ChevronRight, User } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import type { HistorialCalificacionesResponse } from "@/app/types/api";
import EditarMeta from "@/app/components/EditarMeta";
import PaginadorURL from "@/app/components/admin/PaginadorURL";

const ITEMS_PER_PAGE = 5;

export const metadata = {
  title: "Mi Perfil — DriveMe Conductores",
  description: "Tus datos, vehículos y historial de calificaciones como conductor.",
};

async function fetchCalificaciones(idConductor: string): Promise<HistorialCalificacionesResponse | null> {
  const url = process.env.FEEDBACK_APP_URL;
  if (!url) return null;
  try {
    const res = await fetch(`${url}/api/usuarios/${idConductor}/calificaciones`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function EstrellasSVG({ puntaje }: { puntaje: number }) {
  return (
    <div className="flex gap-1" aria-label={`${puntaje} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-5 h-5 ${n <= puntaje ? "text-yellow-400 fill-yellow-400" : "text-zinc-300 dark:text-zinc-700"}`}
          strokeWidth={2}
        />
      ))}
    </div>
  );
}

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { userId, rol, conductorData } = await getSessionData();
  if (rol === "CONDUCTOR_NUEVO") redirect("/");
  if (rol === "ADMIN") redirect("/");

  const calificaciones = conductorData ? await fetchCalificaciones(userId) : null;
  const vehiculoPrincipal = conductorData?.vehiculos[0];

  const resolvedParams = await searchParams;
  const currentPage = Number(resolvedParams.page) || 1;
  const totalReviews = calificaciones?.detalles.length || 0;
  const totalPages = Math.ceil(totalReviews / ITEMS_PER_PAGE);

  const paginatedReviews = calificaciones?.detalles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  ) || [];

  return (
    <div className="flex min-h-screen w-full bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-white font-sans">
      <Sidebar rol={rol} />

      <main className="flex-1 pt-8 pb-24 md:pb-8 md:pl-72 px-4 md:px-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-6">

          <HeaderModulo
            titulo="Mi Perfil"
            icono={User}
            acciones={
              <>
                <ThemeToggle />
                <div className="bg-white dark:bg-zinc-900 rounded-full border-2 border-zinc-950 dark:border-brand shadow-[4px_4px_0px_0px_#09090b] dark:shadow-[4px_4px_0px_0px_#CFFF04] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#09090b] dark:hover:shadow-[6px_6px_0px_0px_#CFFF04] transition-all duration-200 p-0.5">
                  <UserButton
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "w-8 h-8",
                      }
                    }}
                  />
                </div>
              </>
            }
          />

          <div className="rounded-2xl border-2 border-zinc-950 bg-white dark:border-brand dark:bg-zinc-900 shadow-[6px_6px_0px_0px_#09090b] dark:shadow-[6px_6px_0px_0px_#CFFF04] overflow-hidden">
            <div className="px-6 py-5 flex items-center gap-4 bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950">
              <div className="w-16 h-16 rounded-xl border-4 border-zinc-950 bg-brand flex items-center justify-center text-3xl font-extrabold text-zinc-950 shrink-0" aria-hidden>
                {conductorData?.nombre?.[0] ?? "C"}
              </div>
              <div>
                <p className="text-xl font-extrabold text-white dark:text-zinc-950">
                  {conductorData?.nombre} {conductorData?.apellido}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="font-bold text-white text-lg dark:text-zinc-950">
                    {conductorData?.calificacion_promedio.toFixed(1)}
                  </span>
                  {calificaciones && (
                    <span className="text-zinc-400 dark:text-zinc-500 text-sm font-medium">
                      ({totalReviews} reseñas)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {vehiculoPrincipal && (
              <div className="px-6 py-4 flex items-center gap-4 border-t-2 border-zinc-950 dark:border-zinc-800">
                <Car className="w-8 h-8 text-zinc-950 dark:text-white" strokeWidth={2.5} aria-hidden />
                <div>
                  <p className="font-bold text-lg text-zinc-950 dark:text-white uppercase tracking-wide">
                    {vehiculoPrincipal.marca} {vehiculoPrincipal.modelo} {vehiculoPrincipal.anio}
                  </p>
                  <p className="text-sm font-mono font-medium text-zinc-600 dark:text-zinc-400">
                    {vehiculoPrincipal.patente} · {vehiculoPrincipal.color}
                  </p>
                </div>
              </div>
            )}
          </div>

          {conductorData && (
            <EditarMeta
              conductorId={userId}
              metaActual={conductorData.meta_diaria || 30000}
            />
          )}

          <div className="space-y-3">
            <h2 className="text-lg font-extrabold text-zinc-950 dark:text-white uppercase tracking-wide">
              Calificaciones recibidas
            </h2>

            {!calificaciones || totalReviews === 0 ? (
              <EstadoVacio
                icono={StarOff}
                titulo="No hay calificaciones disponibles todavía"
                descripcion="Las opiniones, comentarios y valoraciones numéricas enviadas por los pasajeros se agruparán en este espacio."
              />
            ) : (
              <div className="space-y-4">
                {paginatedReviews.map((cal) => (
                  <div key={cal.id_calificacion} className="rounded-2xl border-2 border-zinc-950 bg-white dark:border-zinc-700 dark:bg-zinc-900 shadow-[4px_4px_0px_0px_#09090b] dark:shadow-none p-5 space-y-3">
                    <div className="flex justify-between items-start gap-3">
                      <EstrellasSVG puntaje={cal.puntaje} />
                      <time className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 shrink-0" dateTime={cal.timestamp}>
                        {new Date(cal.timestamp).toLocaleDateString("es-AR", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </time>
                    </div>
                    {cal.comentario && (
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        &ldquo;{cal.comentario}&rdquo;
                      </p>
                    )}
                  </div>
                ))}

                {/* Controles de Paginación */}
                {totalPages > 1 && (
                  <div className="mt-6 flex justify-center">
                    <PaginadorURL 
                      paginaActual={currentPage} 
                      totalPaginas={totalPages} 
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}