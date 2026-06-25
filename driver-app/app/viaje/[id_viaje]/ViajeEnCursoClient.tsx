"use client";

/**
 * app/viaje/[id_viaje]/ViajeEnCursoClient.tsx
 * -----------------------------------------------------------------------
 * Client Component — Pantalla principal durante un viaje activo.
 * Dark Sci-Fi aesthetic — Tactical Map & Mission Control overlays.
 * -----------------------------------------------------------------------
 */

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { iniciarViaje } from "@/app/actions/conductor/inciarViaje";
import { MapPin, Navigation, Flag, AlertTriangle, X, Circle, CheckCircle } from "lucide-react";
import { formatARS } from "@/lib/formatters";

// Importación dinámica sin SSR (Cargador Dark Sci-Fi)
const MapaViaje = dynamic(() => import("@/app/components/MapaViaje"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#050505]">
      <div className="bg-[#141414] border border-[rgba(220,38,38,0.15)] shadow-[0_0_30px_rgba(220,38,38,0.1)] p-8 rounded-modal text-center space-y-4">
        <div className="w-12 h-12 border-2 border-[rgba(220,38,38,0.2)] border-t-primary rounded-full animate-spin mx-auto shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
        <p className="text-sm font-extrabold text-red-400 tracking-[0.2em] uppercase">Iniciando Enlace...</p>
      </div>
    </div>
  ),
});

interface ViajeData {
  id: string;
  estado_actual: "ACEPTADO" | "EN_CURSO" | "FINALIZADO" | "CANCELADO_POR_CONDUCTOR";
  id_pasajero: string;
  precio_final: number;
  metodo_pago: string;
  pasajero?: { nombre: string };
  origen?: { direccion: string; latitud: number; longitud: number };
  destino?: { direccion: string; latitud: number; longitud: number };
}

interface ViajeEnCursoClientProps {
  viaje: ViajeData;
  conductorId: string;
  conductorLat: number;
  conductorLng: number;
}

export default function ViajeEnCursoClient({
  viaje,
  conductorLat: latInicial,
  conductorLng: lngInicial,
}: ViajeEnCursoClientProps) {
  const router = useRouter();

  const [estado, setEstado] = useState(viaje.estado_actual);

  // Mantenemos coordenadas como números
  const [conductorLat, setConductorLat] = useState(Number(latInicial));
  const [conductorLng, setConductorLng] = useState(Number(lngInicial));

  const [procesando, setProcesando] = useState(false);
  const [confirmarCancelacion, setConfirmarCancelacion] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const origenLat = viaje.origen?.latitud ? Number(viaje.origen.latitud) : 0;
  const origenLng = viaje.origen?.longitud ? Number(viaje.origen.longitud) : 0;
  const destinoLat = viaje.destino?.latitud ? Number(viaje.destino.latitud) : 0;
  const destinoLng = viaje.destino?.longitud ? Number(viaje.destino.longitud) : 0;

  // ── Polling de telemetría (cada 8s) ──────────────────────────────────
  const fetchTelemetria = useCallback(async () => {
    try {
      const res = await fetch(`/api/viajes/${viaje.id}/telemetria`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.coordenadas) {
        setConductorLat(Number(data.coordenadas.lat));
        setConductorLng(Number(data.coordenadas.lng));
      }
    } catch {
      // Pérdida temporal de red
    }
  }, [viaje.id]);

  useEffect(() => {
    if (estado !== "EN_CURSO") return;
    const intervalo = setInterval(fetchTelemetria, 8000);
    return () => clearInterval(intervalo);
  }, [estado, fetchTelemetria]);

  // ── Bloquear Botón "Atrás" del Navegador ──────────────────────────────
  useEffect(() => {
    // Al montar el componente, pusheamos el estado actual
    window.history.pushState(null, "", window.location.href);
    
    const handlePopState = (event: PopStateEvent) => {
      // Si intentan ir hacia atrás, volvemos a pushear la misma URL
      // anulando la navegación
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // ── Acciones de Viaje ────────────────────────────────────────────────
  const handleLlegue = async () => {
    setProcesando(true);
    setError(null);

    // UI Optimista
    setEstado("EN_CURSO");

    const result = await iniciarViaje(viaje.id);
    if (result.success) {
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([50, 30, 50]);
    } else {
      setEstado("ACEPTADO"); // Rollback
      setError(result.error ?? "Error al iniciar el viaje.");
    }
    setProcesando(false);
  };

  const handleFinalizar = () => {
    router.push(`/viaje/${viaje.id}/finalizar`);
  };

  const handleCancelar = async () => {
    if (!confirmarCancelacion) {
      setConfirmarCancelacion(true);
      setTimeout(() => setConfirmarCancelacion(false), 3000);
      return;
    }

    setProcesando(true);
    setError(null);
    try {
      const { cancelarViajeAction } = await import("@/app/actions/conductor/cancelarViaje");
      const success = await cancelarViajeAction(viaje.id);
      
      if (success) {
        router.push("/historial");
      } else {
        setError("Error al cancelar el viaje. No tienes permiso o el viaje ya no está activo.");
        setProcesando(false);
      }
    } catch {
      setError("Error de red al intentar cancelar el viaje.");
      setProcesando(false);
    }
  };

  const nombrePasajero = viaje.pasajero?.nombre ?? "Pasajero";
  const origenDir = viaje.origen?.direccion ?? "Punto de recogida";
  const destinoDir = viaje.destino?.direccion ?? "Punto de destino";

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050505]">

      {/* ── MAPA (fondo fullscreen) ────────────────────────────────── */}
      <div className="absolute inset-0 z-0 map-dark-filter">
        <MapaViaje
          key={`mapa-fase-${estado}`}
          origenLat={origenLat} origenLng={origenLng}
          destinoLat={destinoLat} destinoLng={destinoLng}
          conductorLat={conductorLat} conductorLng={conductorLng}
          estado={estado}
        />
      </div>

      {/* ── OVERLAY SUPERIOR ───────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-safe z-[1000] pointer-events-none">
        <div className="bg-[rgba(20,20,20,0.85)] backdrop-blur-md border border-[rgba(220,38,38,0.2)] shadow-[0_0_25px_rgba(220,38,38,0.1)] rounded-card p-4 pointer-events-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-sharp border flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(220,38,38,0.2)] ${estado === "ACEPTADO" ? 'bg-gradient-to-b from-[#1F1F1F] to-[#0A0A0A] border-[rgba(220,38,38,0.3)] text-red-400' : 'bg-gradient-to-b from-[#1F1F1F] to-[#0A0A0A] border-[rgba(59,130,246,0.3)] text-info shadow-[0_0_15px_rgba(59,130,246,0.2)]'}`}>
                {estado === "ACEPTADO" ? <MapPin size={22} strokeWidth={2.5} /> : <Navigation size={22} strokeWidth={2.5} />}
              </div>
              <div>
                <p className="font-extrabold text-lg leading-tight text-white uppercase tracking-wide">
                  {estado === "ACEPTADO" ? `Objetivo: ${nombrePasajero}` : `Transportando: ${nombrePasajero}`}
                </p>
                <p className="text-xs font-bold text-[#9CA3AF] mt-0.5 uppercase tracking-widest truncate max-w-[200px] md:max-w-md">
                  {estado === "ACEPTADO" ? origenDir : destinoDir}
                </p>
              </div>
            </div>

            <span className={`px-3 py-1.5 rounded-sharp text-[10px] font-extrabold tracking-[0.2em] uppercase border ${estado === "ACEPTADO" ? "bg-[rgba(220,38,38,0.1)] border-primary text-red-400 shadow-[0_0_10px_rgba(220,38,38,0.2)]" : "bg-[rgba(59,130,246,0.1)] border-info text-info shadow-[0_0_10px_rgba(59,130,246,0.2)]"}`}>
              {estado === "ACEPTADO" ? "En Camino" : "En Curso"}
            </span>
          </div>
        </div>
      </div>

      {/* ── OVERLAY INFERIOR ───────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-safe z-[1000]">
        <div className="bg-[#141414] border border-[rgba(220,38,38,0.2)] shadow-[0_0_40px_rgba(220,38,38,0.15)] rounded-modal overflow-hidden">

          <div className="px-5 pt-5 pb-4 space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-3 text-sm flex-1">
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(220,38,38,0.8)] shrink-0" />
                  <span className="font-bold text-[#E5E7EB] leading-tight">{origenDir}</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-2.5 h-2.5 rounded-full border-2 border-primary shadow-[0_0_8px_rgba(220,38,38,0.5)] shrink-0" />
                  <span className="font-bold text-[#E5E7EB] leading-tight">{destinoDir}</span>
                </div>
              </div>
              <div className="text-right shrink-0 bg-[#0A0A0A] p-3 rounded-card border border-[rgba(255,255,255,0.06)]">
                <p className="text-2xl md:text-3xl font-black text-white tracking-tighter">
                  {formatARS(viaje.precio_final)}
                </p>
                <p className="text-[10px] font-extrabold text-[#9CA3AF] uppercase tracking-widest mt-1">
                  {viaje.metodo_pago}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="px-5 pb-3">
              <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[#EF4444] font-bold p-3 text-sm rounded-sharp flex items-center gap-2">
                <AlertTriangle size={18} strokeWidth={2.5} /> {error}
              </div>
            </div>
          )}

          <div className="px-5 pb-5">
            {estado === "ACEPTADO" ? (
              <button
                onClick={handleLlegue}
                disabled={procesando}
                className="w-full min-h-[64px] rounded-sharp border border-primary-dark bg-gradient-to-b from-primary-hover to-primary text-white font-extrabold text-lg uppercase tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.2)] hover:translate-y-[-1px] hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                <CheckCircle size={22} strokeWidth={2.5} />
                {procesando ? "CONFIRMANDO..." : "LLEGUÉ AL ORIGEN"}
              </button>
            ) : (
              <button
                onClick={handleFinalizar}
                disabled={procesando}
                className="w-full min-h-[64px] rounded-sharp border border-info/50 bg-gradient-to-b from-[#3B82F6] to-[#2563EB] text-white font-extrabold text-lg uppercase tracking-widest shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:translate-y-[-1px] hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                <Flag size={22} strokeWidth={2.5} />
                {procesando ? "FINALIZANDO..." : "FINALIZAR VIAJE"}
              </button>
            )}

            <div className="mt-4 text-center">
              <button
                onClick={handleCancelar}
                disabled={procesando}
                className={`font-bold text-xs tracking-wider uppercase transition-all px-6 py-3 rounded-sharp border flex items-center justify-center gap-2 mx-auto ${confirmarCancelacion
                  ? "bg-[rgba(239,68,68,0.1)] border-[#EF4444] text-[#EF4444] shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                  : "bg-transparent border-transparent text-[#6B7280] hover:text-white"
                  }`}
              >
                {confirmarCancelacion ? (
                  <>
                    <AlertTriangle size={16} strokeWidth={2.5} /> ¿SEGURO? TOCÁ PARA ABORTAR
                  </>
                ) : (
                  <>
                    <X size={16} strokeWidth={2.5} /> ABORTAR MISIÓN
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}