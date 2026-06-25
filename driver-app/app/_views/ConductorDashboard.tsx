"use client";

import { Prisma } from "@/app/generated/prisma/client";
import { CarFront, Clock, DollarSign, Target, Zap, Star, LayoutDashboard, ChevronDown, Radar } from "lucide-react";
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
  const vehiculosActivos = conductorData.vehiculos.filter(v => v.isActive);
  const [selectedVehiculoId, setSelectedVehiculoId] = useState<string>(
    conductorData.vehiculo_activo_id || (vehiculosActivos.length > 0 ? vehiculosActivos[0].id_vehiculo : "")
  );
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  const vehiculo = vehiculosActivos.find(v => v.id_vehiculo === selectedVehiculoId) || vehiculosActivos[0];

  const { toast, mostrarToast, ocultarToast } = useToast();

  const {
    solicitudActual, timerSegundos, aceptando,
    handleAceptar, handleRechazar, limpiarSolicitud
  } = useRadarViajes({
    isOnline: conductorData.estado === "ONLINE",
    conductorId: conductorData.id_conductor,
    vehiculoId: vehiculo?.id_vehiculo,
    latitud: conductorData.latitud_actual ?? -38.7183,
    longitud: conductorData.longitud_actual ?? -62.2664,
    mostrarToast
  });

  const { isOnline, isPending, toggleEstado } = useEstadoConductor({
    conductorId: conductorData.id_conductor,
    estadoInicial: conductorData.estado === "ONLINE",
    mostrarToast,
    onApagar: limpiarSolicitud
  });

  const handleToggleEstado = () => {
    toggleEstado(selectedVehiculoId);
  };

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
  const colorTimer = timerSegundos > 15 ? "#DC2626" : timerSegundos > 8 ? "#D97706" : "#EF4444";
  const porcentajeMeta = Math.min(Math.round((metricasHoy.ganancia / metricasHoy.metaDiaria) * 100), 100);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={ocultarToast} />}

      <HeaderModulo
        titulo="Dashboard"
        icono={LayoutDashboard}
        subtitulo={vehiculo ? <>{vehiculo.marca} {vehiculo.modelo} <span className="text-primary font-mono mx-0.5">/</span> {vehiculo.patente}</> : "Sin vehículo asignado"}
        acciones={
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-sharp border border-[rgba(255,255,255,0.1)] bg-[#141414]">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="font-extrabold text-sm text-white">{conductorData.calificacion_promedio.toFixed(1)}</span>
          </div>
        }
      />

      {/* METAS Y RADAR PREDICTIVO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-card border border-[rgba(220,38,38,0.15)] bg-[rgba(20,20,20,0.8)] backdrop-blur-sm p-4 shadow-[0_0_20px_rgba(220,38,38,0.04)] flex flex-col justify-center">
          <div className="flex justify-between items-end mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-b from-primary-hover to-primary rounded-sharp border border-primary-dark">
                <Target className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="font-extrabold uppercase text-[#9CA3AF] text-sm tracking-[0.2em]">Meta Diaria</h2>
            </div>
            <span className="font-extrabold text-xl text-primary">{porcentajeMeta}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-[#1F1F1F] overflow-hidden border border-[rgba(255,255,255,0.06)]">
            <div className="h-full w-full bg-gradient-to-r from-primary-dark to-primary transition-transform duration-1000 origin-left" style={{ transform: `scaleX(${porcentajeMeta / 100})` }} />
          </div>
          <div className="flex justify-between items-center mt-2 text-xs font-bold text-[#9CA3AF]">
            <span>{formatARS(metricasHoy.ganancia)} logrados</span>
            <span>{formatARS(metricasHoy.metaDiaria)}</span>
          </div>
        </div>

        <div className="rounded-card border border-[rgba(220,38,38,0.15)] bg-[rgba(20,20,20,0.8)] backdrop-blur-sm p-4 shadow-[0_0_20px_rgba(220,38,38,0.04)] flex flex-col justify-center relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10" aria-hidden="true"><Radar className="w-24 h-24 text-primary" strokeWidth={1.5} /></div>
          <div className="relative z-10">
            <h2 className="font-extrabold uppercase text-sm flex items-center gap-2 mb-1 text-red-400 tracking-[0.2em]">
              <Zap className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" /> Radar Predictivo IA
            </h2>
            {cargandoSugerencias ? (
              <p className="text-sm font-bold leading-tight mt-2 animate-pulse text-[#9CA3AF]">
                Consultando tendencias...
              </p>
            ) : sugerencias?.suggestedZones && sugerencias.suggestedZones.length > 0 ? (
              <div className="mt-2 flex flex-col gap-2 max-h-32 overflow-y-auto pr-1 pb-1">
                {sugerencias.suggestedZones.map((zona, idx) => (
                  <div key={idx} className="bg-[#1F1F1F] text-white rounded-sharp p-3 border border-[rgba(220,38,38,0.1)]">
                    <p className="font-extrabold text-sm">{zona.zoneName}</p>
                    <p className="text-xs mt-1 font-semibold leading-tight text-[#9CA3AF]">{zona.reason}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-lg font-bold leading-tight mt-1 text-[#9CA3AF]">
                {isOnline ? "Sin datos recientes. ¡Empezá a recorrer!" : "Conectate para recibir alertas de demanda."}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* SELECCIÓN DE VEHÍCULO Y BOTÓN ONLINE/OFFLINE */}
      <div className="space-y-3">
        {vehiculosActivos.length > 0 && (
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-sm font-extrabold uppercase tracking-[0.2em] px-2 text-[#9CA3AF]">
              Vehículo Activo
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => !isOnline && !isPending && setIsSelectOpen(!isSelectOpen)}
                disabled={isOnline || isPending}
                className="w-full text-left p-4 pr-12 rounded-card border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] text-white font-bold text-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed flex items-center justify-between"
              >
                <span>{vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.patente})` : "Seleccionar..."}</span>
                <ChevronDown className="w-6 h-6 stroke-[2.5] text-[#6B7280] absolute right-4" />
              </button>
              
              {isSelectOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsSelectOpen(false)} 
                  />
                  <div className="absolute z-50 mt-2 w-full rounded-card border border-[rgba(220,38,38,0.15)] bg-[#141414] shadow-[0_0_30px_rgba(220,38,38,0.1)] overflow-hidden flex flex-col">
                    {vehiculosActivos.map((v) => (
                      <button
                        key={v.id_vehiculo}
                        type="button"
                        onClick={() => {
                          setSelectedVehiculoId(v.id_vehiculo);
                          setIsSelectOpen(false);
                        }}
                        className={`w-full text-left p-4 font-bold text-lg border-b border-[rgba(255,255,255,0.06)] last:border-b-0 hover:bg-primary hover:text-white transition-colors ${
                          selectedVehiculoId === v.id_vehiculo ? "bg-[rgba(220,38,38,0.1)] text-primary" : "bg-transparent text-white"
                        }`}
                      >
                        {v.marca} {v.modelo} ({v.patente})
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleToggleEstado}
          disabled={isPending || vehiculosActivos.length === 0}
          className={`w-full min-h-[72px] rounded-full border px-6 py-4 font-sci text-xl tracking-widest transition-all duration-300 focus:outline-none active:scale-[0.98] disabled:opacity-40 backdrop-blur-sm ${isOnline
            ? "border-primary bg-[rgba(220,38,38,0.2)] text-white shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:shadow-[0_0_40px_rgba(220,38,38,0.5)]"
            : "border-[rgba(220,38,38,0.4)] bg-[rgba(220,38,38,0.05)] text-primary shadow-[0_0_20px_rgba(220,38,38,0.15)] hover:bg-[rgba(220,38,38,0.1)] hover:shadow-[0_0_30px_rgba(220,38,38,0.3)]"
            }`}
        >
          {isPending ? "Actualizando..." : isOnline ? "CONECTADO — Tocá para desconectarte" : vehiculosActivos.length === 0 ? "NO TIENES VEHÍCULOS ACTIVOS" : "CONECTARME AHORA"}
        </button>

      </div>

      {/* MÉTRICAS HOY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "HORAS ONLINE", valor: metricasHoy.horas, icon: <Clock className="w-8 h-8" strokeWidth={2} />, accent: "primary" },
          { label: "ESTIMADO", valor: formatARS(metricasHoy.ganancia), icon: <DollarSign className="w-8 h-8" strokeWidth={2} />, accent: "info" },
          { label: "VIAJES", valor: metricasHoy.viajes.toString(), icon: <CarFront className="w-8 h-8" strokeWidth={2} />, accent: "success" },
        ].map(({ label, valor, icon, accent }) => {
          const accentColors: Record<string, string> = {
            primary: "border-primary/30 shadow-[0_0_15px_rgba(220,38,38,0.08)]",
            info: "border-[#3B82F6]/30 shadow-[0_0_15px_rgba(59,130,246,0.08)]",
            success: "border-[#059669]/30 shadow-[0_0_15px_rgba(5,150,105,0.08)]",
          };
          return (
            <div key={label} className={`p-4 rounded-card border bg-[rgba(20,20,20,0.8)] backdrop-blur-sm flex flex-col justify-between min-h-[100px] ${accentColors[accent]}`}>
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-[#9CA3AF]">{label}</span>
              <div className="flex justify-between items-end mt-2">
                <span className="text-3xl font-extrabold uppercase text-white">{valor}</span>
                <span className="text-[#6B7280]">{icon}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* TARJETA DE SOLICITUD DE VIAJE */}
      {isOnline && (
        <div className="rounded-card border-2 border-[rgba(220,38,38,0.3)] bg-[rgba(20,20,20,0.8)] backdrop-blur-sm shadow-[0_0_30px_rgba(220,38,38,0.08)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[rgba(220,38,38,0.15)] bg-[#0A0A0A]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">
              {solicitudActual ? "NUEVA SOLICITUD DE VIAJE" : "Rastreando zona..."}
            </p>
          </div>

          {!solicitudActual ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-[#6B7280]">
              <div className="w-12 h-12 border-4 border-t-transparent border-primary rounded-full animate-spin" />
              <p className="text-sm font-semibold">Esperando solicitudes cercanas...</p>
            </div>
          ) : (
            <div className="p-4 flex flex-col gap-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#9CA3AF]">Tiempo para decidir</span>
                  <span className="text-lg font-extrabold tabular-nums text-white">{timerSegundos}s</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#1F1F1F] overflow-hidden border border-[rgba(255,255,255,0.06)]">
                  <div className="h-full w-full transition-transform duration-1000 ease-linear origin-left" style={{ transform: `scaleX(${porcentajeTimer / 100})`, backgroundColor: colorTimer }} />
                </div>
              </div>

              <div className="text-center py-2">
                <p className="text-5xl md:text-6xl font-extrabold uppercase tracking-tight text-white">
                  {formatARS(solicitudActual.precio_estimado)}
                </p>
              </div>

              <div className="rounded-card border border-[rgba(255,255,255,0.06)] bg-[#0A0A0A] p-4 space-y-3 text-sm">
                <div>
                  <p className="font-bold text-lg text-white">Pasajero</p>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="font-medium text-[#9CA3AF] text-base">{solicitudActual.pasajero.nombre}</p>
                    <div className="flex items-center gap-1 bg-[#1A1A1A] px-2 py-0.5 rounded-full border border-[rgba(255,255,255,0.1)]">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-xs text-white">
                        {solicitudActual.puntaje_promedio_pasajero ? solicitudActual.puntaje_promedio_pasajero.toFixed(1) : "Nuevo"}
                      </span>
                    </div>
                  </div>
                  {solicitudActual.comentario_promedio_pasajero && (
                    <p className="mt-2 text-xs text-[#9CA3AF] italic bg-[rgba(255,255,255,0.03)] p-2 rounded-md border border-[rgba(255,255,255,0.05)]">
                      "{solicitudActual.comentario_promedio_pasajero}"
                    </p>
                  )}
                </div>
                <div className="border-t border-[rgba(255,255,255,0.06)] pt-3">
                  <p className="font-bold text-lg text-white">Origen</p>
                  <p className="mt-1 font-medium text-[#9CA3AF]">{solicitudActual.origen.direccion}</p>
                </div>
                <div className="border-t border-[rgba(255,255,255,0.06)] pt-3">
                  <p className="font-bold text-lg text-white">Destino</p>
                  <p className="mt-1 font-medium text-[#9CA3AF]">{solicitudActual.destino.direccion}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button onClick={handleAceptar} disabled={aceptando} className="w-full min-h-[64px] rounded-sharp border border-primary-dark bg-gradient-to-b from-primary-hover to-primary text-white font-extrabold text-xl uppercase tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.2)] hover:translate-y-[-1px] hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all">
                  {aceptando ? "Aceptando..." : "✓ ACEPTAR"}
                </button>
                <button onClick={handleRechazar} disabled={aceptando} className="w-full min-h-[52px] rounded-sharp border border-[rgba(156,163,175,0.3)] bg-transparent text-white font-bold uppercase tracking-wider hover:border-primary transition-all">
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