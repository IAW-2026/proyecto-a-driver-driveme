// app/perfil/page.tsx
// Server Component — Perfil del conductor con calificaciones de la Feedback App.
import { redirect } from "next/navigation";
import { getSessionData } from "@/lib/getSessionData";
import Sidebar from "@/app/components/Sidebar";
import ThemeToggle from "@/app/components/ThemeToggle";
import type { HistorialCalificacionesResponse } from "@/app/types/api";

export const metadata = {
  title: "Mi Perfil — DriveMe Conductores",
  description: "Tus datos, vehículos y historial de calificaciones como conductor.",
};

async function fetchCalificaciones(idConductor: string): Promise<HistorialCalificacionesResponse | null> {
  const url = process.env.FEEDBACK_APP_URL;
  if (!url) return null;
  try {
    const res = await fetch(`${url}/api/usuarios/${idConductor}/calificaciones`, {
      next: { revalidate: 60 }, // cache de 1 minuto
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function EstrellasSVG({ puntaje }: { puntaje: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${puntaje} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className="text-xl" style={{ color: n <= puntaje ? "#ffc800" : "var(--border)" }}>
          ★
        </span>
      ))}
    </div>
  );
}

export default async function PerfilPage() {
  const { userId, rol, conductorData } = await getSessionData();
  if (rol === "CONDUCTOR_NUEVO") redirect("/");
  if (rol === "ADMIN") redirect("/");

  const calificaciones = conductorData ? await fetchCalificaciones(userId) : null;
  const vehiculoPrincipal = conductorData?.vehiculos[0];

  return (
    <div className="flex min-h-screen w-full bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-white font-sans">
      <Sidebar rol={rol} />

      <main className="flex-1 pt-20 pb-24 md:pb-8 md:pl-72 px-4 md:px-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* ── Header ───────────────────────────────────────────── */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-extrabold" style={{ color: "var(--foreground)" }}>
              Mi Perfil
            </h1>
            <ThemeToggle />
          </div>

          {/* ── Tarjeta de Identidad ────────────────────────────── */}
          <div className="rounded-2xl border-2 border-zinc-950 bg-white dark:border-white dark:bg-zinc-900 shadow-[6px_6px_0px_0px_#09090b] dark:shadow-[6px_6px_0px_0px_#ffffff] overflow-hidden">
            <div className="px-6 py-5 flex items-center gap-4 bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950">
              {/* Avatar placeholder */}
              <div
                className="w-16 h-16 rounded-xl border-4 border-zinc-950 bg-zinc-950 dark:border-white dark:bg-white flex items-center justify-center text-3xl font-extrabold text-white dark:text-zinc-950 shrink-0"
                aria-hidden
              >
                {conductorData?.nombre?.[0] ?? "C"}
              </div>
              <div>
                <p className="text-xl font-extrabold text-white dark:text-zinc-950">
                  {conductorData?.nombre} {conductorData?.apellido}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-yellow-300 text-lg">★</span>
                  <span className="font-bold text-white text-lg dark:text-zinc-950">
                    {conductorData?.calificacion_promedio.toFixed(1)}
                  </span>
                  {calificaciones && (
                    <span className="text-white/70 text-sm">
                      ({calificaciones.total_calificaciones} reseñas)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Datos del vehículo */}
            {vehiculoPrincipal && (
              <div
                className="px-6 py-4 flex items-center gap-4 border-t"
                style={{ borderColor: "var(--border)" }}
              >
                <span className="text-3xl" aria-hidden>🚗</span>
                <div>
                  <p className="font-bold" style={{ color: "var(--foreground)" }}>
                    {vehiculoPrincipal.marca} {vehiculoPrincipal.modelo} {vehiculoPrincipal.anio}
                  </p>
                  <p className="text-sm font-mono" style={{ color: "var(--muted)" }}>
                    {vehiculoPrincipal.patente} · {vehiculoPrincipal.color}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Calificaciones recibidas ─────────────────────────── */}
          <div>
            <h2 className="text-lg font-extrabold mb-3" style={{ color: "var(--foreground)" }}>
              Calificaciones recibidas
            </h2>

            {!calificaciones ? (
              <div className="rounded-2xl border-2 border-zinc-950 bg-white dark:border-white dark:bg-zinc-900 p-6 text-center text-zinc-600 dark:text-zinc-400">
                <p className="text-4xl mb-2">⭐</p>
                <p className="font-medium">No hay calificaciones disponibles todavía.</p>
                <p className="text-xs mt-1">Las calificaciones de los pasajeros aparecerán acá.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {calificaciones.detalles.map((cal) => (
                  <div
                    key={cal.id_calificacion}
                    className="rounded-2xl border-2 border-zinc-950 bg-white dark:border-white dark:bg-zinc-900 shadow-[6px_6px_0px_0px_#09090b] dark:shadow-[6px_6px_0px_0px_#ffffff] p-4 space-y-2"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <EstrellasSVG puntaje={cal.puntaje} />
                      <time
                        className="text-xs shrink-0"
                        dateTime={cal.timestamp}
                        style={{ color: "var(--muted)" }}
                      >
                        {new Date(cal.timestamp).toLocaleDateString("es-AR", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </time>
                    </div>
                    {cal.comentario && (
                      <p className="text-sm italic" style={{ color: "var(--muted)" }}>
                        &ldquo;{cal.comentario}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
