"use client";

import { Prisma } from "@/app/generated/prisma/client";
import { Car, Clock, DollarSign, Target, Zap, Star, LayoutDashboard } from "lucide-react";
import ThemeToggle from "@/app/components/ThemeToggle";
import HeaderModulo from "@/app/components/HeaderModulo";
import Toast from "@/app/components/Toast";
import { formatARS } from "@/lib/formatters";
import { useEffect, useState } from "react";
import { sugerirZonasAction, type SugerenciaIA } from "@/app/actions/conductor/sugerirZonas";
import { useToast } from "@/app/hooks/useToast";
import { useEstadoConductor } from "@/app/hooks/useEstadoConductor";
import { useRadarViajes } from "@/app/hooks/useRadarViajes";

type ConductorConVehiculos = Prisma.ConductorGetPayload<{ include: { vehiculos: true } }>;

interface ConductorDashboardProps {
  conductorData: ConductorConVehiculos;
  metricasHoy: { ganancia: number; viajes: number; horas: string; metaDiaria: number; };
}

export default function ConductorDashboard({ conductorData, metricasHoy }: ConductorDashboardProps) {
  const vehiculo = conductorData.vehiculos[0];

  // 1. Hook de Notificaciones
  const { toast, mostrarToast, ocultarToast } = useToast();

  // 2. Hook del Radar Operativo
  const {
    solicitudActual, timerSegundos, aceptando,
    handleAceptar, handleRechazar, limpiarSolicitud
  } = useRadarViajes({
    isOnline: conductorData.estado === "ONLINE", // Se actualiza mediante el hook de estado
    conductorId: conductorData.id_conductor,
    vehiculoId: vehiculo?.id_vehiculo,
    latitud: conductorData.latitud_actual ?? -38.7183,
    longitud: conductorData.longitud_actual ?? -62.2664,
    mostrarToast
  });

  // 3. Hook de Estado Conductor
  const { isOnline, isPending, toggleEstado } = useEstadoConductor({
    conductorId: conductorData.id_conductor,
    estadoInicial: conductorData.estado === "ONLINE",
    mostrarToast,
    onApagar: limpiarSolicitud
  });

  // 4. Hook de Sugerencias IA
  const [sugerencias, setSugerencias] = useState<SugerenciaIA | null>(null);
  const [cargandoSugerencias, setCargandoSugerencias] = useState(true);

  useEffect(() => {
    async function fetchSugerencias() {
      try {
        const res = await sugerirZonasAction();
        if (res.success && res.data) {
          setSugerencias(res.data);
        } else {
          setSugerencias(null);
        }
      } catch (error) {
        console.error("Error al obtener sugerencias:", error);
        setSugerencias(null);
      } finally {
        setCargandoSugerencias(false);
      }
    }
    fetchSugerencias();
  }, []);

  // Cálculos Visuales
  const porcentajeTimer = (timerSegundos / 30) * 100;
  const colorTimer = timerSegundos > 15 ? "var(--primary)" : timerSegundos > 8 ? "#ECC94B" : "#FF007F";
  const porcentajeMeta = Math.min(Math.round((metricasHoy.ganancia / metricasHoy.metaDiaria) * 100), 100);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={ocultarToast} />}

      <HeaderModulo
        titulo="Dashboard"
        icono={LayoutDashboard}
        subtitulo={vehiculo ? <>{vehiculo.marca} {vehiculo.modelo} <span className="text-zinc-950 dark:text-brand font-mono mx-0.5">/</span> {vehiculo.patente}</> : "Sin vehículo asignado"}
        acciones={
          <>
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-zinc-950 bg-white shadow-[2px_2px_0px_0px_#09090b] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-none">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="font-extrabold text-sm text-zinc-950 dark:text-white">{conductorData.calificacion_promedio.toFixed(1)}</span>
            </div>
            <ThemeToggle />
          </>
        }
      />

      {/* METAS Y RADAR PREDICTIVO */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity duration-300 ${!isOnline ? "opacity-50 grayscale-[50%]" : "opacity-100"}`}>
        <div className="rounded-2xl border-2 border-zinc-950 bg-white dark:border-zinc-700 dark:bg-zinc-800 p-4 shadow-[4px_4px_0px_0px_#09090b] dark:shadow-none flex flex-col justify-center">
          <div className="flex justify-between items-end mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-brand rounded-lg border-2 border-zinc-950">
                <Target className="w-5 h-5 text-zinc-950" strokeWidth={3} />
              </div>
              <h2 className="font-extrabold uppercase text-zinc-950 dark:text-white text-sm">Meta Diaria</h2>
            </div>
            <span className="font-extrabold text-xl text-zinc-950 dark:text-brand">{porcentajeMeta}%</span>
          </div>
          <div className="w-full h-4 rounded-full border-2 border-zinc-950 bg-zinc-100 dark:bg-zinc-950 overflow-hidden">
            <div className="h-full bg-brand border-r-2 border-zinc-950 transition-all duration-1000" style={{ width: `${porcentajeMeta}%` }} />
          </div>
          <div className="flex justify-between items-center mt-2 text-xs font-bold text-zinc-600 dark:text-zinc-400">
            <span>{formatARS(metricasHoy.ganancia)} logrados</span>
            <span>{formatARS(metricasHoy.metaDiaria)}</span>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-zinc-950 bg-alert text-white dark:border-alert dark:bg-zinc-900 p-4 shadow-[4px_4px_0px_0px_#09090b] dark:shadow-[4px_4px_0px_0px_#FF007F] flex flex-col justify-center relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-20"><Zap className="w-24 h-24" strokeWidth={3} /></div>
          <div className="relative z-10">
            <h2 className="font-extrabold uppercase text-sm flex items-center gap-2 mb-1 dark:text-alert">
              <Zap className="w-4 h-4" strokeWidth={3} /> Radar Predictivo IA
            </h2>
            {cargandoSugerencias ? (
              <p className="text-sm font-bold leading-tight mt-2 animate-pulse">
                Consultando tendencias...
              </p>
            ) : sugerencias?.suggestedZones && sugerencias.suggestedZones.length > 0 ? (
              <div className="mt-2 flex flex-col gap-2 max-h-32 overflow-y-auto pr-1 pb-1">
                {sugerencias.suggestedZones.map((zona, idx) => (
                  <div key={idx} className="bg-black/15 dark:bg-white/5 rounded-lg p-2.5 border-2 border-transparent">
                    <p className="font-extrabold text-sm">{zona.zoneName}</p>
                    <p className="text-xs mt-1 font-medium leading-tight opacity-90">{zona.reason}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-lg font-bold leading-tight mt-1">
                {isOnline ? "Sin datos recientes. ¡Empezá a recorrer!" : "Conectate para recibir alertas de demanda."}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* BOTÓN ONLINE/OFFLINE */}
      <button
        onClick={toggleEstado}
        disabled={isPending}
        className={`w-full min-h-[72px] rounded-2xl border-2 px-6 py-4 font-extrabold text-xl tracking-wide transition-transform duration-200 focus:outline-none shadow-[4px_4px_0px_0px_#09090b] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#09090b] dark:border-2 dark:border-brand dark:shadow-[4px_4px_0px_0px_#CFFF04] dark:hover:-translate-y-1 dark:hover:shadow-[6px_6px_0px_0px_#CFFF04] active:scale-[0.98] disabled:opacity-60 ${isOnline ? "border-zinc-950 bg-brand text-zinc-950" : "border-zinc-950 bg-[rgba(207,255,4,0.08)] text-zinc-950 dark:text-white dark:bg-zinc-950"
          }`}
      >
        {isPending ? "Actualizando..." : isOnline ? "CONECTADO — Tocá para desconectarte" : "CONECTARME AHORA"}
      </button>

      {/* MÉTRICAS HOY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "HORAS ONLINE", valor: metricasHoy.horas, icon: <Clock className="w-8 h-8" strokeWidth={2.5} /> },
          { label: "ESTIMADO", valor: formatARS(metricasHoy.ganancia), icon: <DollarSign className="w-8 h-8" strokeWidth={2.5} /> },
          { label: "VIAJES", valor: metricasHoy.viajes.toString(), icon: <Car className="w-8 h-8" strokeWidth={2.5} /> },
        ].map(({ label, valor, icon }) => (
          <div key={label} className="p-4 rounded-2xl border-2 border-zinc-950 bg-info text-white dark:border-info dark:bg-zinc-900 shadow-[4px_4px_0px_0px_#09090b] dark:shadow-[4px_4px_0px_0px_#8B5CF6] flex flex-col justify-between min-h-[100px]">
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">{label}</span>
            <div className="flex justify-between items-end mt-2">
              <span className="text-3xl font-extrabold uppercase">{valor}</span>
              <span>{icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* TARJETA DE SOLICITUD DE VIAJE */}
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
              <p className="text-sm font-semibold">Esperando solicitudes cercanas...</p>
            </div>
          ) : (
            <div className="p-4 flex flex-col gap-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-500">Tiempo para decidir</span>
                  <span className="text-lg font-extrabold tabular-nums" style={{ color: colorTimer }}>{timerSegundos}s</span>
                </div>
                <div className="w-full h-2 rounded-full border border-zinc-950 bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div className="h-full transition-all duration-1000 ease-linear" style={{ width: `${porcentajeTimer}%`, backgroundColor: colorTimer }} />
                </div>
              </div>

              <div className="text-center py-2">
                <p className="text-5xl md:text-6xl font-extrabold uppercase tracking-tight text-zinc-950 dark:text-white">
                  {formatARS(solicitudActual.precio_estimado)}
                </p>
              </div>

              <div className="rounded-2xl border-2 border-zinc-950 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-950 p-4 space-y-3 text-sm">
                <div>
                  <p className="font-bold text-lg">Pasajero</p>
                  <p className="mt-1 font-medium text-zinc-600 dark:text-zinc-400">{solicitudActual.pasajero.nombre}</p>
                </div>
                <div className="border-t-2 border-zinc-950 dark:border-zinc-700 pt-3">
                  <p className="font-bold text-lg">Origen</p>
                  <p className="mt-1 font-medium text-zinc-600 dark:text-zinc-400">{solicitudActual.origen.direccion}</p>
                </div>
                <div className="border-t-2 border-zinc-950 dark:border-zinc-700 pt-3">
                  <p className="font-bold text-lg">Destino</p>
                  <p className="mt-1 font-medium text-zinc-600 dark:text-zinc-400">{solicitudActual.destino.direccion}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button onClick={handleAceptar} disabled={aceptando} className="w-full min-h-[64px] rounded-2xl border-2 border-zinc-950 bg-brand text-zinc-950 font-extrabold text-xl shadow-[4px_4px_0px_0px_#09090b] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#09090b] transition-all">
                  {aceptando ? "Aceptando..." : "✓ ACEPTAR"}
                </button>
                <button onClick={handleRechazar} disabled={aceptando} className="w-full min-h-[52px] rounded-2xl border-2 border-zinc-950 bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white font-bold shadow-[4px_4px_0px_0px_#09090b] dark:shadow-[4px_4px_0px_0px_#CFFF04] dark:border-brand hover:-translate-y-1 transition-all">
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