// app/perfil/page.tsx
// Server Component — Perfil del conductor con calificaciones de la Feedback App.
import { redirect } from "next/navigation";
import { getSessionData } from "@/lib/getSessionData";
import { checkActiveRideRedirect } from "@/lib/checkActiveRide";
import Sidebar from "@/app/components/Nav";
import HeaderModulo from "@/app/components/HeaderModulo";
import EstadoVacio from "@/app/components/EstadoVacio";
import { Car, Star, StarOff, ChevronLeft, ChevronRight, User } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import type { HistorialCalificacionesResponse } from "@/app/types/api";
import EditarMeta from "@/app/components/EditarMeta";
import PaginadorURL from "@/app/components/admin/PaginadorURL";
import BotonBaja from "@/app/components/BotonBaja";

import BotonReportarCalificacion from "@/app/components/BotonReportarCalificacion";
import GestorVehiculos from "@/app/components/GestorVehiculos";
import { m2mHeaders } from "@/lib/m2m";

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
      headers: m2mHeaders('feedback'),
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      console.warn(`[fetchCalificaciones] Feedback App devolvió ${res.status} para conductor ${idConductor}`);
      return null;
    }
    return res.json();
  } catch (e) {
    console.error('[fetchCalificaciones] Feedback App inalcanzable:', e);
    return null;
  }
}

function EstrellasSVG({ puntaje }: { puntaje: number }) {
  return (
    <div className="flex gap-1" role="img" aria-label={`${puntaje} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-4 h-4 md:w-5 md:h-5 ${n <= puntaje ? "text-yellow-500 fill-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]" : "text-[rgba(255,255,255,0.1)]"}`}
          strokeWidth={n <= puntaje ? 0 : 2}
          aria-hidden="true"
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
  await checkActiveRideRedirect(conductorData);
  if (rol === "CONDUCTOR_NUEVO") redirect("/");
  if (rol === "ADMIN") redirect("/");

  const calificaciones = conductorData ? await fetchCalificaciones(userId) : null;
  const vehiculosActivos = conductorData?.vehiculos.filter(v => v.isActive) || [];

  const resolvedParams = await searchParams;
  const currentPage = Number(resolvedParams.page) || 1;
  const totalReviews = calificaciones?.detalles.length || 0;
  const totalPages = Math.ceil(totalReviews / ITEMS_PER_PAGE);

  const paginatedReviews = calificaciones?.detalles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  ) || [];

  return (
    <div className="flex min-h-screen w-full font-sans">
      <Sidebar rol={rol} nombre={conductorData?.nombre} />

      <main className="flex-1 pt-8 md:pt-28 pb-24 md:pb-8 px-4 md:px-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-8">

          <HeaderModulo
            titulo="MI PERFIL"
            subtitulo="Administrá tu cuenta y tus preferencias"
            acciones={
              <div className="bg-[rgba(20,20,20,0.8)] rounded-full border border-[rgba(220,38,38,0.2)] shadow-[0_0_20px_rgba(220,38,38,0.15)] hover:-translate-y-[1px] hover:shadow-[0_0_30px_rgba(220,38,38,0.25)] transition-all duration-300 p-1.5 backdrop-blur-md">
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "w-9 h-9",
                    }
                  }}
                />
              </div>
            }
          />

          <div className="rounded-modal border border-[rgba(220,38,38,0.25)] bg-[rgba(10,10,10,0.7)] backdrop-blur-md shadow-[0_0_30px_rgba(220,38,38,0.1)] overflow-hidden">
            <div className="px-6 py-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[rgba(220,38,38,0.25)]">
              
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-full border border-[rgba(220,38,38,0.4)] bg-[rgba(220,38,38,0.1)] flex items-center justify-center text-3xl font-sci text-primary shadow-[0_0_25px_rgba(220,38,38,0.2)] shrink-0" aria-hidden>
                  {conductorData?.nombre?.[0] ?? "C"}
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold text-white tracking-wide">
                    {conductorData?.nombre} {conductorData?.apellido}
                  </p>
                  <p className="text-sm font-medium text-[#9CA3AF] mt-1 flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(220,38,38,0.8)]"></span>
                     ID: {conductorData?.licencia ?? "—"}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-start md:items-end gap-2 bg-[rgba(20,20,20,0.5)] p-4 rounded-card border border-[rgba(255,255,255,0.05)]">
                 <div className="flex items-center gap-2">
                  <Star className="w-6 h-6 text-yellow-500 fill-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.6)]" aria-hidden="true" />
                  <span className="font-sci text-white text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                    {conductorData?.calificacion_promedio.toFixed(1)}
                  </span>
                </div>
                {calificaciones && (
                  <span className="text-[#6B7280] text-[10px] font-sci tracking-[0.2em] uppercase">
                    RATING PROMEDIO ({totalReviews})
                  </span>
                )}
              </div>
            </div>

            <GestorVehiculos vehiculos={vehiculosActivos} />
          </div>

          {conductorData && (
            <EditarMeta
              conductorId={userId}
              metaActual={conductorData.meta_diaria || 30000}
            />
          )}

          <section className="space-y-5 rounded-modal border border-[rgba(220,38,38,0.25)] bg-[rgba(10,10,10,0.7)] backdrop-blur-md shadow-[0_0_30px_rgba(220,38,38,0.1)] p-6 md:p-8">
            <h2 className="text-lg font-sci text-white uppercase tracking-[0.2em] mb-4">
              Feedback Global
            </h2>

            {conductorData?.comentario_promedio && (
              <div className="bg-[rgba(220,38,38,0.05)] border border-[rgba(220,38,38,0.2)] p-6 rounded-card shadow-[0_0_20px_rgba(220,38,38,0.1)]">
                <p className="text-[10px] font-sci text-primary tracking-[0.2em] uppercase mb-3">
                  Análisis IA del Piloto
                </p>
                <p className="text-[#E5E7EB] font-medium italic text-base leading-relaxed">
                  &ldquo;{conductorData.comentario_promedio}&rdquo;
                </p>
              </div>
            )}


            {!calificaciones || totalReviews === 0 ? (
              <EstadoVacio
                icono={StarOff}
                titulo="No hay registros disponibles"
                descripcion="Las evaluaciones enviadas por los pasajeros aparecerán en este registro."
              />
            ) : (
              <div className="space-y-4">
                {paginatedReviews.map((cal) => (
                  <div key={cal.id_calificacion} className="rounded-card border border-[rgba(255,255,255,0.08)] bg-[rgba(20,20,20,0.6)] hover:bg-[rgba(30,30,30,0.8)] transition-all p-5 space-y-4 group">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <EstrellasSVG puntaje={cal.puntaje} />
                      <time className="text-[10px] font-sci uppercase tracking-[0.2em] text-[#6B7280] group-hover:text-[#9CA3AF] transition-colors" dateTime={cal.timestamp}>
                        {new Date(cal.timestamp).toLocaleDateString("es-AR", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </time>
                    </div>
                    {cal.comentario && (
                      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 border-t border-[rgba(255,255,255,0.05)] pt-4">
                        <p className="text-sm font-medium text-[#E5E7EB] leading-relaxed italic">
                          &ldquo;{cal.comentario}&rdquo;
                        </p>
                        <BotonReportarCalificacion idCalificacion={cal.id_calificacion} />
                      </div>
                    )}
                  </div>
                ))}

                {/* Controles de Paginación */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center border-t border-[rgba(220,38,38,0.25)] pt-6">
                    <PaginadorURL
                      paginaActual={currentPage}
                      totalPaginas={totalPages}
                    />
                  </div>
                )}
              </div>
            )}
          </section>

          <BotonBaja />
        </div>
      </main>
    </div>
  );
}