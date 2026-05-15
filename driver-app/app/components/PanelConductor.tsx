"use client";

/**
 * app/components/PanelConductor.tsx
 * -----------------------------------------------------------------------
 * Client Component — Panel principal del conductor activo.
 *
 * Cambios UX respecto a la versión anterior:
 * - Botón Online/Offline: CTA de pantalla completa (min 72px) en vez de toggle pequeño
 * - Tarjeta de solicitud: precio en texto 5xl, timer de 30s con barra de progreso
 * - Botones ACEPTAR/RECHAZAR: ancho completo, 64px de alto, separados físicamente
 * - Feedback háptico al cambiar estado (Navigator.vibrate)
 * - Polling cada 5s cuando está online; se detiene con solicitud activa
 * - Al aceptar: llama al API Route propio (/api/viajes) que sincroniza con Rider App
 * -----------------------------------------------------------------------
 */

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toggleConductorStatus } from "@/app/actions/conductor";
import { Prisma } from "@/app/generated/prisma/client";
import { SolicitudViaje } from "@/app/types/viajes";

type ConductorConVehiculos = Prisma.ConductorGetPayload<{
  include: { vehiculos: true };
}>;

interface PanelConductorProps {
  conductorData: ConductorConVehiculos;
}

const TIMER_DURACION = 30; // segundos para aceptar la solicitud

// ── Toast simple ─────────────────────────────────────────────────────────────
function Toast({ mensaje, tipo }: { mensaje: string; tipo: "ok" | "error" }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl font-bold text-sm animate-[fadeInDown_0.3s_ease]"
      style={{
        backgroundColor: tipo === "ok" ? "var(--accent)" : "#E53E3E",
        color: tipo === "ok" ? "var(--text-inverted)" : "#fff",
      }}
    >
      {mensaje}
    </div>
  );
}

export default function PanelConductor({ conductorData }: PanelConductorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOnline, setIsOnline] = useState(conductorData.estado === "ONLINE");
  const [solicitudActual, setSolicitudActual] = useState<SolicitudViaje | null>(null);
  const [timerSegundos, setTimerSegundos] = useState(TIMER_DURACION);
  const [aceptando, setAceptando] = useState(false);
  const [toast, setToast] = useState<{ mensaje: string; tipo: "ok" | "error" } | null>(null);

  const mostrarToast = useCallback((mensaje: string, tipo: "ok" | "error" = "ok") => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 2500);
  }, []);

  // ── Toggle Online/Offline ────────────────────────────────────────────────
  const handleToggle = () => {
    const nuevoEstado = !isOnline;
    setIsOnline(nuevoEstado);
    if (!nuevoEstado) {
      setSolicitudActual(null);
      setTimerSegundos(TIMER_DURACION);
    }
    // Vibración háptica (solo mobile)
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(nuevoEstado ? [30, 20, 30] : [60]);
    }

    startTransition(async () => {
      const result = await toggleConductorStatus(conductorData.id_conductor, nuevoEstado);
      if (!result.success) {
        setIsOnline(!nuevoEstado); // rollback
        mostrarToast("Error al cambiar estado. Intentá de nuevo.", "error");
      } else {
        mostrarToast(nuevoEstado ? "¡Estás online! Buscando viajes..." : "Modo offline activado.");
      }
    });
  };

  // ── Polling de solicitudes (REST) ────────────────────────────────────────
  useEffect(() => {
    if (!isOnline || solicitudActual) return;
    const intervalo = setInterval(async () => {
      try {
        const res = await fetch("/api/solicitudes/mock");
        const data = await res.json();
        if (data.solicitud) {
          setSolicitudActual(data.solicitud);
          setTimerSegundos(TIMER_DURACION);
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([100, 50, 100, 50, 200]);
          }
        }
      } catch {
        // silencioso — pérdida temporal de red
      }
    }, 5000);
    return () => clearInterval(intervalo);
  }, [isOnline, solicitudActual]);

  // ── Timer de cuenta regresiva ────────────────────────────────────────────
  useEffect(() => {
    if (!solicitudActual) return;

    if (timerSegundos <= 0) {
      const timeout = setTimeout(() => {
        setSolicitudActual(null);
        setTimerSegundos(TIMER_DURACION);
        mostrarToast("Tiempo agotado. Solicitud descartada.", "error");
      }, 0);
      return () => clearTimeout(timeout);
    }

    const tick = setTimeout(() => setTimerSegundos((t) => t - 1), 1000);
    return () => clearTimeout(tick);
  }, [solicitudActual, timerSegundos, mostrarToast]);

  // ── Aceptar solicitud ────────────────────────────────────────────────────
  const handleAceptar = async () => {
    if (!solicitudActual || aceptando) return;
    setAceptando(true);

    const vehiculoId = conductorData.vehiculos[0]?.id_vehiculo;
    if (!vehiculoId) {
      mostrarToast("No tenés vehículo registrado.", "error");
      setAceptando(false);
      return;
    }

    try {
      const res = await fetch("/api/viajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_solicitud: solicitudActual.id_solicitud,
          id_conductor: conductorData.id_conductor,
          id_pasajero: solicitudActual.pasajero.id_pasajero,
          id_vehiculo: vehiculoId,
          latitud_actual: conductorData.latitud_actual ?? -38.7183,
          longitud_actual: conductorData.longitud_actual ?? -62.2664,
          metodo_pago: "EFECTIVO",
          precio_estimado: solicitudActual.precio_estimado,
          origen_latitud: solicitudActual.origen.latitud,
          origen_longitud: solicitudActual.origen.longitud,
          origen_direccion: solicitudActual.origen.direccion,
          destino_latitud: solicitudActual.destino.latitud,
          destino_longitud: solicitudActual.destino.longitud,
          destino_direccion: solicitudActual.destino.direccion,
          pasajero_nombre: solicitudActual.pasajero.nombre
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        mostrarToast("Ese viaje ya fue tomado por otro conductor.", "error");
        setSolicitudActual(null);
        return;
      }

      if (!res.ok) {
        mostrarToast("Error al aceptar el viaje. Intentá de nuevo.", "error");
        return;
      }

      // Navegar a la pantalla de viaje en curso
      router.push(`/viaje/${data.data.id_viaje}`);
    } catch {
      mostrarToast("Sin conexión. Intentá de nuevo.", "error");
    } finally {
      setAceptando(false);
    }
  };

  const handleRechazar = () => {
    setSolicitudActual(null);
    setTimerSegundos(TIMER_DURACION);
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(40);
  };

  const porcentajeTimer = (timerSegundos / TIMER_DURACION) * 100;
  const colorTimer = timerSegundos > 15 ? "var(--accent)" : timerSegundos > 8 ? "#ECC94B" : "#E53E3E";

  return (
    <div className="flex flex-col gap-4 md:gap-6 w-full">
      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} />}

      {/* ── 1. BOTÓN ONLINE/OFFLINE (CTA grande) ─────────────────────── */}
      <button
        onClick={handleToggle}
        disabled={isPending}
        aria-pressed={isOnline}
        aria-label={isOnline ? "Desconectarte — dejar de recibir viajes" : "Conectarte — empezar a recibir viajes"}
        className={`w-full min-h-[72px] rounded-2xl border-2 px-6 py-4 font-extrabold text-xl tracking-wide transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-brand/30 shadow-[4px_4px_0px_0px_#09090b] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#09090b] dark:border-2 dark:border-brand dark:shadow-[4px_4px_0px_0px_#CFFF04] dark:hover:-translate-y-1 dark:hover:shadow-[6px_6px_0px_0px_#CFFF04] active:scale-[0.98] disabled:opacity-60 ${isOnline ? "border-zinc-950 bg-brand text-zinc-950" : "border-zinc-950 bg-[rgba(207,255,4,0.08)] text-[var(--foreground)] dark:bg-zinc-950"}`}
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-3">
            <span className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "currentColor", borderTopColor: "transparent" }} />
            Actualizando...
          </span>
        ) : isOnline ? (
          "● CONECTADO — Tocá para desconectarte"
        ) : (
          "CONECTARME AHORA"
        )}
      </button>

      {/* ── 2. PANEL DE MÉTRICAS ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="group" aria-label="Métricas del día">
        {[
          { label: "HORAS\nONLINE", emoji: "⏱️" },
          { label: "GANANCIAS\nESTIMADAS", emoji: "💵" },
          { label: "VIAJES\nHOY", emoji: "🚗" },
        ].map(({ label, emoji }) => (
          <div
            key={label}
            className="p-5 rounded-2xl border-2 border-zinc-950 bg-white text-zinc-950 dark:border-white dark:bg-zinc-900 dark:text-white shadow-[6px_6px_0px_0px_#09090b] dark:shadow-[6px_6px_0px_0px_#ffffff] flex flex-col justify-between min-h-[120px]"
          >
            <span className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.24em] leading-tight whitespace-pre-line text-zinc-600 dark:text-zinc-300">
              {label}
            </span>
            <div className="flex justify-between items-end mt-4">
              <span className="text-4xl md:text-5xl font-extrabold uppercase">
                —
              </span>
              <span className="text-2xl md:text-3xl">{emoji}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. TARJETA DE SOLICITUD ──────────────────────────────────── */}
      {isOnline && (
        <div
          className="rounded-2xl border-4 border-zinc-950 bg-white dark:border-white dark:bg-zinc-900 shadow-[6px_6px_0px_0px_#09090b] dark:shadow-[6px_6px_0px_0px_#ffffff] overflow-hidden"
          aria-live="polite"
          aria-label="Área de solicitudes de viaje"
        >
          {/* Cabecera */}
          <div className="px-4 py-3 border-b-2 border-zinc-950 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-950">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-950 dark:text-zinc-100">
              {solicitudActual ? "NUEVA SOLICITUD DE VIAJE" : "Rastreando zona..."}
            </p>
          </div>

          {!solicitudActual ? (
            /* Estado: buscando */
            <div className="flex flex-col items-center justify-center py-10 gap-3" style={{ color: "var(--muted)" }}>
              <div
                className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
                aria-hidden
              />
              <p className="text-sm font-semibold">Esperando solicitudes cercanas...</p>
            </div>
          ) : (
            /* Estado: solicitud recibida */
            <div className="p-4 flex flex-col gap-4">
              {/* Timer visual */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold" style={{ color: "var(--muted)" }}>Tiempo para decidir</span>
                  <span className="text-lg font-extrabold tabular-nums" style={{ color: colorTimer }}>
                    {timerSegundos}s
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-muted)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${porcentajeTimer}%`, backgroundColor: colorTimer }}
                    role="progressbar"
                    aria-valuenow={timerSegundos}
                    aria-valuemin={0}
                    aria-valuemax={TIMER_DURACION}
                    aria-label={`${timerSegundos} segundos para aceptar`}
                  />
                </div>
              </div>

              {/* Precio — el dato más importante */}
              <div className="text-center py-4">
                <p className="text-5xl md:text-6xl font-extrabold uppercase tracking-tight text-zinc-950 dark:text-white">
                  ${solicitudActual.precio_estimado.toLocaleString("es-AR")}
                </p>
                <p className="text-sm mt-2 font-medium uppercase tracking-[0.2em] text-zinc-600 dark:text-zinc-300">
                  estimado
                </p>
              </div>

              {/* Datos del viaje */}
              <div className="rounded-2xl border-t-2 border-zinc-950 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-950 p-4 space-y-3 text-sm">
                <div>
                  <p className="font-bold text-lg text-zinc-950 dark:text-white">Pasajero</p>
                  <p className="mt-1 font-medium text-zinc-600 dark:text-zinc-300">{solicitudActual.pasajero.nombre}</p>
                </div>
                <div>
                  <p className="font-bold text-lg text-zinc-950 dark:text-white">Origen</p>
                  <p className="mt-1 font-medium text-zinc-600 dark:text-zinc-300">{solicitudActual.origen.direccion}</p>
                </div>
                <div className="border-t-2 border-zinc-950 dark:border-zinc-700 pt-3">
                  <p className="font-bold text-lg text-zinc-950 dark:text-white">Destino</p>
                  <p className="mt-1 font-medium text-zinc-600 dark:text-zinc-300">{solicitudActual.destino.direccion}</p>
                </div>
                <div className="border-t-2 border-zinc-950 dark:border-zinc-700 pt-3">
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-600 dark:text-zinc-300">Tiempo estimado</p>
                  <p className="mt-1 font-medium text-zinc-600 dark:text-zinc-300">{solicitudActual.eta_min} min · {solicitudActual.distancia_km} km</p>
                </div>
              </div>

              {/* Botones de acción — tamaño táctil mínimo 64px */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleAceptar}
                  disabled={aceptando}
                  aria-label="Aceptar solicitud de viaje"
                  className="w-full min-h-[64px] rounded-2xl border-2 border-zinc-950 bg-brand text-zinc-950 font-extrabold text-xl transition-transform duration-200 shadow-[4px_4px_0px_0px_#09090b] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#09090b] dark:border-2 dark:border-brand dark:shadow-[4px_4px_0px_0px_#CFFF04] dark:hover:-translate-y-1 dark:hover:shadow-[6px_6px_0px_0px_#CFFF04] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-brand/30 disabled:opacity-60"
                >
                  {aceptando ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "currentColor", borderTopColor: "transparent" }} />
                      Aceptando...
                    </span>
                  ) : (
                    "✓ ACEPTAR"
                  )}
                </button>

                <button
                  onClick={handleRechazar}
                  disabled={aceptando}
                  aria-label="Rechazar solicitud de viaje"
                  className="w-full min-h-[52px] rounded-2xl border-2 border-zinc-950 bg-[rgba(207,255,4,0.08)] text-[var(--foreground)] font-bold transition-transform duration-200 shadow-[4px_4px_0px_0px_#09090b] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#09090b] dark:border-2 dark:border-brand dark:bg-zinc-950 dark:shadow-[4px_4px_0px_0px_#CFFF04] dark:hover:-translate-y-1 dark:hover:shadow-[6px_6px_0px_0px_#CFFF04] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-brand/30 disabled:opacity-60 hover:bg-[rgba(207,255,4,0.12)]"
                >
                  Rechazar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}