"use client";

/**
 * app/_views/ConductorDashboard.tsx
 * -----------------------------------------------------------------------
 * Client Component — Dashboard unificado del conductor activo.
 * Contiene la lógica de conexión, cola rotativa de viajes, y la UI de métricas/radar.
 * -----------------------------------------------------------------------
 */

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toggleConductorStatus } from "@/app/actions/conductor";
import { Prisma } from "@/app/generated/prisma/client";
import { SolicitudViaje } from "@/app/types/viajes";
import ThemeToggle from "@/app/components/ThemeToggle";
import { Car, Clock, DollarSign, Target, Zap, Star } from "lucide-react";

type ConductorConVehiculos = Prisma.ConductorGetPayload<{
  include: { vehiculos: true };
}>;

interface ConductorDashboardProps {
  conductorData: ConductorConVehiculos;
  metricasHoy: {
    ganancia: number;
    viajes: number;
    horas: string;
    metaDiaria: number;
  };
}

const TIMER_DURACION = 30;

// ── Toast simple ─────────────────────────────────────────────────────────────
function Toast({ mensaje, tipo }: { mensaje: string; tipo: "ok" | "error" }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-[4px_4px_0px_0px_#09090b] border-2 border-zinc-950 font-bold text-sm animate-[fadeInDown_0.3s_ease]"
      style={{
        backgroundColor: tipo === "ok" ? "var(--info)" : "#FF007F",
        color: tipo === "ok" ? "#fff" : "#fff",
      }}
    >
      {mensaje}
    </div>
  );
}

export default function ConductorDashboard({ conductorData, metricasHoy }: ConductorDashboardProps) {
  const router = useRouter();
  const vehiculo = conductorData.vehiculos[0];

  // ── Estados ──────────────────────────────────────────────────────────────
  const [isPending, startTransition] = useTransition();
  const [isOnline, setIsOnline] = useState(conductorData.estado === "ONLINE");
  const [solicitudActual, setSolicitudActual] = useState<SolicitudViaje | null>(null);
  const [colaSolicitudes, setColaSolicitudes] = useState<SolicitudViaje[]>([]);
  const [timerSegundos, setTimerSegundos] = useState(TIMER_DURACION);
  const [aceptando, setAceptando] = useState(false);
  const [toast, setToast] = useState<{ mensaje: string; tipo: "ok" | "error" } | null>(null);

  const mostrarToast = useCallback((mensaje: string, tipo: "ok" | "error" = "ok") => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 2500);
  }, []);

  // ── Lógica de Conexión y Control de Cola ─────────────────────────────────
  const handleToggle = () => {
    const nuevoEstado = !isOnline;
    setIsOnline(nuevoEstado);
    if (!nuevoEstado) {
      setSolicitudActual(null);
      setColaSolicitudes([]);
      setTimerSegundos(TIMER_DURACION);
    }
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(nuevoEstado ? [30, 20, 30] : [60]);
    }

    startTransition(async () => {
      const result = await toggleConductorStatus(conductorData.id_conductor, nuevoEstado);
      if (!result.success) {
        setIsOnline(!nuevoEstado);
        mostrarToast("Error al cambiar estado. Intentá de nuevo.", "error");
      } else {
        mostrarToast(nuevoEstado ? "¡Estás online! Buscando viajes..." : "Modo offline activado.", "ok");
      }
    });
  };

  // EFECTO 1: Polling del backend para llenar la cola cuando está vacía
  useEffect(() => {
    if (!isOnline || solicitudActual || colaSolicitudes.length > 0) return;

    const intervalo = setInterval(async () => {
      try {
        const res = await fetch("/api/solicitudes?estado=BUSCANDO_CONDUCTOR");
        const data = await res.json();

        if (data.solicitudes && data.solicitudes.length > 0) {
          setColaSolicitudes(data.solicitudes);
        }
      } catch {

      }
    }, 5000);

    return () => clearInterval(intervalo);
  }, [isOnline, solicitudActual, colaSolicitudes]);

  // EFECTO 2: Consumir la cola y rotar la solicitud expuesta
  useEffect(() => {
    if (isOnline && !solicitudActual && colaSolicitudes.length > 0) {
      const proximaSolicitud = colaSolicitudes[0];

      const timeout = setTimeout(() => {
        setSolicitudActual(proximaSolicitud);
        setColaSolicitudes((prev) => prev.slice(1));
        setTimerSegundos(TIMER_DURACION);

        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([100, 50, 100, 50, 200]);
        }
      }, 0);

      return () => clearTimeout(timeout);
    }
  }, [isOnline, solicitudActual, colaSolicitudes]);

  // ── Temporizador Regresivo ───────────────────────────────────────────────
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

  // ── Acciones de Solicitud ────────────────────────────────────────────────
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

      if (res.status === 409) {
        mostrarToast("Ese viaje ya fue tomado por otro conductor.", "error");
        setSolicitudActual(null);
        setAceptando(false);
        return;
      }
      if (!res.ok) {
        mostrarToast("Error al aceptar el viaje.", "error");
        setAceptando(false);
        return;
      }
      const data = await res.json();
      router.push(`/viaje/${data.data.id_viaje}`);
    } catch {
      mostrarToast("Sin conexión. Intentá de nuevo.", "error");
      setAceptando(false);
    }
  };

  const handleRechazar = () => {
    setSolicitudActual(null);
    setTimerSegundos(TIMER_DURACION);
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(40);
  };

  // ── Cálculos Visuales ────────────────────────────────────────────────────
  const porcentajeTimer = (timerSegundos / TIMER_DURACION) * 100;
  const colorTimer = timerSegundos > 15 ? "var(--primary)" : timerSegundos > 8 ? "#ECC94B" : "#FF007F";

  const gananciaHoy = metricasHoy.ganancia;
  const viajesHoy = metricasHoy.viajes;
  const horasOnlineHoy = metricasHoy.horas;

  const metaDiaria = metricasHoy.metaDiaria;
  const porcentajeMeta = Math.min(Math.round((gananciaHoy / metaDiaria) * 100), 100);

  return (
    <section className="w-full max-w-5xl mx-auto rounded-2xl border-4 border-zinc-950 bg-zinc-50 dark:border-brand dark:bg-zinc-900 shadow-[8px_8px_0px_0px_#09090b] dark:shadow-[8px_8px_0px_0px_#CFFF04] overflow-hidden">
      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} />}

      {/* Header */}
      <div className="flex justify-between items-center px-4 py-4 md:px-6 md:py-5 border-b-4 border-zinc-950 dark:border-brand bg-brand dark:bg-zinc-950 transition-colors">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight uppercase text-zinc-950 dark:text-white">
            Dashboard
          </h1>
          {vehiculo && (
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-400 mt-0.5 uppercase tracking-wide">
              {vehiculo.marca} {vehiculo.modelo} <span className="text-zinc-950 dark:text-brand font-mono mx-1">/</span> {vehiculo.patente}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-zinc-950 bg-white shadow-[2px_2px_0px_0px_#09090b] dark:border-brand dark:bg-zinc-900 dark:shadow-[2px_2px_0px_0px_#CFFF04]">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="font-extrabold text-sm text-zinc-950 dark:text-white">
              {conductorData.calificacion_promedio.toFixed(1)}
            </span>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        {/* Módulos */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity duration-300 ${!isOnline ? "opacity-50 grayscale-[50%]" : "opacity-100"}`}>
          <div className="rounded-2xl border-2 border-zinc-950 bg-white dark:border-zinc-700 dark:bg-zinc-800 p-4 shadow-[4px_4px_0px_0px_#09090b] dark:shadow-none flex flex-col justify-center">
            <div className="flex justify-between items-end mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-brand rounded-lg border-2 border-zinc-950">
                  <Target className="w-5 h-5 text-zinc-950" strokeWidth={3} />
                </div>
                <h2 className="font-extrabold uppercase text-zinc-950 dark:text-white text-sm">Meta Diaria</h2>
              </div>
              <span className="font-extrabold text-xl text-zinc-950 dark:text-brand">
                {porcentajeMeta}%
              </span>
            </div>
            <div className="w-full h-4 rounded-full border-2 border-zinc-950 bg-zinc-100 dark:bg-zinc-950 overflow-hidden">
              <div
                className="h-full bg-brand border-r-2 border-zinc-950 transition-all duration-1000"
                style={{ width: `${porcentajeMeta}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-2 text-xs font-bold text-zinc-600 dark:text-zinc-400">
              <span>${gananciaHoy.toLocaleString("es-AR")} logrados</span>
              <span>${metaDiaria.toLocaleString("es-AR")}</span>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-zinc-950 bg-alert text-white dark:border-alert dark:bg-zinc-900 p-4 shadow-[4px_4px_0px_0px_#09090b] dark:shadow-[4px_4px_0px_0px_#FF007F] flex flex-col justify-center relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-20">
              <Zap className="w-24 h-24" strokeWidth={3} />
            </div>
            <div className="relative z-10">
              <h2 className="font-extrabold uppercase text-sm flex items-center gap-2 mb-1 dark:text-alert">
                <Zap className="w-4 h-4" strokeWidth={3} />
                Radar Predictivo
              </h2>
              <p className="text-lg font-bold leading-tight mt-1">
                {isOnline ? (
                  <>La demanda en el <span className="underline decoration-brand decoration-4 underline-offset-2">Centro</span> está aumentando.</>
                ) : (
                  "Conectate para recibir alertas de demanda."
                )}
              </p>
              <p className="text-xs font-medium mt-3 text-white/80 dark:text-zinc-400">
                {isOnline ? "Basado en tendencias de la última hora." : "Radar en pausa"}
              </p>
            </div>
          </div>
        </div>

        {/* Botón de estado */}
        <button
          onClick={handleToggle}
          disabled={isPending}
          className={`w-full min-h-[72px] rounded-2xl border-2 px-6 py-4 font-extrabold text-xl tracking-wide transition-transform duration-200 focus:outline-none shadow-[4px_4px_0px_0px_#09090b] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#09090b] dark:border-2 dark:border-brand dark:shadow-[4px_4px_0px_0px_#CFFF04] dark:hover:-translate-y-1 dark:hover:shadow-[6px_6px_0px_0px_#CFFF04] active:scale-[0.98] disabled:opacity-60 ${isOnline ? "border-zinc-950 bg-brand text-zinc-950" : "border-zinc-950 bg-[rgba(207,255,4,0.08)] text-zinc-950 dark:text-white dark:bg-zinc-950"
            }`}
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

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "HORAS ONLINE", valor: horasOnlineHoy, icon: <Clock className="w-8 h-8" strokeWidth={2.5} /> },
            { label: "ESTIMADO", valor: `$${gananciaHoy.toLocaleString("es-AR")}`, icon: <DollarSign className="w-8 h-8" strokeWidth={2.5} /> },
            { label: "VIAJES", valor: viajesHoy.toString(), icon: <Car className="w-8 h-8" strokeWidth={2.5} /> },
          ].map(({ label, valor, icon }) => (
            <div
              key={label}
              className="p-4 rounded-2xl border-2 border-zinc-950 bg-info text-white dark:border-info dark:bg-zinc-900 dark:text-white shadow-[4px_4px_0px_0px_#09090b] dark:shadow-[4px_4px_0px_0px_#8B5CF6] flex flex-col justify-between min-h-[100px]"
            >
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-white">
                {label}
              </span>
              <div className="flex justify-between items-end mt-2">
                <span className="text-3xl font-extrabold uppercase">{valor}</span>
                <span>{icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Tarjeta de Solicitud */}
        {isOnline && (
          <div className="rounded-2xl border-4 border-zinc-950 bg-white dark:border-white dark:bg-zinc-900 shadow-[6px_6px_0px_0px_#09090b] dark:shadow-[6px_6px_0px_0px_#ffffff] overflow-hidden">
            <div className="px-4 py-3 border-b-2 border-zinc-950 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-950">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-950 dark:text-zinc-100">
                {solicitudActual ? "NUEVA SOLICITUD DE VIAJE" : "Rastreando zona..."}
              </p>
            </div>

            {!solicitudActual ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-zinc-500 dark:text-zinc-400">
                <div className="w-12 h-12 border-4 border-t-transparent border-brand rounded-full animate-spin" />
                <p className="text-sm font-semibold text-zinc-950 dark:text-white">Esperando solicitudes cercanas...</p>
              </div>
            ) : (
              <div className="p-4 flex flex-col gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Tiempo para decidir</span>
                    <span className="text-lg font-extrabold tabular-nums" style={{ color: colorTimer }}>
                      {timerSegundos}s
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full border border-zinc-950 bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full transition-all duration-1000 ease-linear"
                      style={{ width: `${porcentajeTimer}%`, backgroundColor: colorTimer }}
                    />
                  </div>
                </div>

                <div className="text-center py-2">
                  <p className="text-5xl md:text-6xl font-extrabold uppercase tracking-tight text-zinc-950 dark:text-white">
                    ${solicitudActual.precio_estimado.toLocaleString("es-AR")}
                  </p>
                  <p className="text-sm mt-1 font-bold uppercase tracking-[0.2em] text-zinc-600 dark:text-zinc-400">
                    estimado
                  </p>
                </div>

                <div className="rounded-2xl border-2 border-zinc-950 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-950 p-4 space-y-3 text-sm">
                  <div>
                    <p className="font-bold text-lg text-zinc-950 dark:text-white">Pasajero</p>
                    <p className="mt-1 font-medium text-zinc-600 dark:text-zinc-400">{solicitudActual.pasajero.nombre}</p>
                  </div>
                  <div className="border-t-2 border-zinc-950 dark:border-zinc-700 pt-3">
                    <p className="font-bold text-lg text-zinc-950 dark:text-white">Origen</p>
                    <p className="mt-1 font-medium text-zinc-600 dark:text-zinc-400">{solicitudActual.origen.direccion}</p>
                  </div>
                  <div className="border-t-2 border-zinc-950 dark:border-zinc-700 pt-3">
                    <p className="font-bold text-lg text-zinc-950 dark:text-white">Destino</p>
                    <p className="mt-1 font-medium text-zinc-600 dark:text-zinc-400">{solicitudActual.destino.direccion}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleAceptar}
                    disabled={aceptando}
                    className="w-full min-h-[64px] rounded-2xl border-2 border-zinc-950 bg-brand text-zinc-950 font-extrabold text-xl shadow-[4px_4px_0px_0px_#09090b] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#09090b] transition-all"
                  >
                    {aceptando ? "Aceptando..." : "✓ ACEPTAR"}
                  </button>
                  <button
                    onClick={handleRechazar}
                    disabled={aceptando}
                    className="w-full min-h-[52px] rounded-2xl border-2 border-zinc-950 bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white font-bold shadow-[4px_4px_0px_0px_#09090b] dark:shadow-[4px_4px_0px_0px_#CFFF04] dark:border-brand hover:-translate-y-1 transition-all"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}