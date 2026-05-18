"use client";

/**
 * app/viaje/[id_viaje]/ViajeEnCursoClient.tsx
 * -----------------------------------------------------------------------
 * Client Component — Pantalla principal durante un viaje activo.
 * -----------------------------------------------------------------------
 */

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { iniciarViaje } from "@/app/actions/conductor";
import { MapPin, Navigation, Flag, AlertTriangle, X, Circle, CheckCircle } from "lucide-react";

// Importación dinámica sin SSR (Cargador Neobrutalista)
const MapaViaje = dynamic(() => import("@/app/components/MapaViaje"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#E4E4E7]">
      <div className="bg-white border-4 border-[#09090B] shadow-[6px_6px_0px_0px_#09090B] p-6 rounded-xl text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#09090B] border-t-brand rounded-full animate-spin mx-auto" />
        <p className="text-sm font-extrabold text-[#09090B] tracking-widest uppercase">Cargando radar...</p>
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

  // ── FIX CONDUCTOR: VOLVEMOS A TIERRA FIRME ──────────────────────────
  // Deshacemos el cruce de coordenadas. El backend sí las mandaba bien.
  // Solo aseguramos que se interpreten como números (Number).
  const [conductorLat, setConductorLat] = useState(Number(latInicial));
  const [conductorLng, setConductorLng] = useState(Number(lngInicial));

  const [procesando, setProcesando] = useState(false);
  const [confirmarCancelacion, setConfirmarCancelacion] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mantenemos el orden lógico original, solo forzando el Number()
  const origenLat = viaje.origen?.latitud ? Number(viaje.origen.latitud) : -38.7183;
  const origenLng = viaje.origen?.longitud ? Number(viaje.origen.longitud) : -62.2664;
  const destinoLat = viaje.destino?.latitud ? Number(viaje.destino.latitud) : -38.7021;
  const destinoLng = viaje.destino?.longitud ? Number(viaje.destino.longitud) : -62.2801;

  // ── Polling de telemetría (cada 8s) ──────────────────────────────────
  const fetchTelemetria = useCallback(async () => {
    try {
      const res = await fetch(`/api/viajes/${viaje.id}/telemetria`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.coordenadas) {
        // También deshacemos el cruce acá
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

  // ── Acciones de Viaje ────────────────────────────────────────────────
  const handleLlegue = async () => {
    setProcesando(true);
    setError(null);

    // UI Optimista: Cambiamos el estado instantáneamente para que el mapa reaccione 
    // sin esperar a que Next.js revalide la ruta y evitar trabas visuales.
    setEstado("EN_CURSO");

    const result = await iniciarViaje(viaje.id);
    if (result.success) {
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([50, 30, 50]);
    } else {
      setEstado("ACEPTADO"); // Hacemos rollback si hubo error en el backend
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
      const res = await fetch(`/api/viajes/${viaje.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "CANCELADO_POR_CONDUCTOR" }),
      });
      if (res.ok) {
        router.push("/historial");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Error al cancelar el viaje.");
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
    <div className="relative w-full h-screen overflow-hidden bg-[#E4E4E7]">

      {/* ── MAPA (fondo fullscreen) ────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <MapaViaje
          key={`mapa-fase-${estado}`} // FIX 2: Obliga a React a destruir el mapa y redibujar limpio al cambiar de estado
          origenLat={origenLat} origenLng={origenLng}
          destinoLat={destinoLat} destinoLng={destinoLng}
          conductorLat={conductorLat} conductorLng={conductorLng}
          estado={estado}
        />
      </div>

      {/* ── OVERLAY SUPERIOR ───────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-safe z-[1000]">
        <div className="bg-white border-4 border-[#09090B] shadow-[6px_6px_0px_0px_#09090B] rounded-xl p-3 md:p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg border-4 border-[#09090B] shadow-[2px_2px_0px_0px_#09090B] flex items-center justify-center shrink-0 ${estado === "ACEPTADO" ? 'bg-brand' : 'bg-info text-white'}`}>
                {estado === "ACEPTADO" ? <MapPin size={24} color="#09090B" /> : <Navigation size={24} color="#09090B" />}
              </div>
              <div>
                <p className="font-black text-lg leading-tight text-[#09090B]">
                  {estado === "ACEPTADO" ? `Buscando a ${nombrePasajero}` : `Llevando a ${nombrePasajero}`}
                </p>
                <p className="text-xs font-bold text-gray-600 mt-0.5 uppercase tracking-wide">
                  {estado === "ACEPTADO" ? origenDir : destinoDir}
                </p>
              </div>
            </div>

            <span className={`px-3 py-1.5 rounded-md text-xs font-black tracking-widest uppercase border-2 border-[#09090B] ${estado === "ACEPTADO" ? "bg-brand text-[#09090B]" : "bg-info text-white"}`}>
              {estado === "ACEPTADO" ? "En camino" : "En curso"}
            </span>
          </div>
        </div>
      </div>

      {/* ── OVERLAY INFERIOR ───────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-safe z-[1000]">
        <div className="bg-white border-4 border-[#09090B] shadow-[6px_6px_0px_0px_#09090B] rounded-xl overflow-hidden">

          <div className="px-5 pt-5 pb-4 space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-2 text-sm flex-1 mr-4">
                <p className="flex items-start gap-2 font-bold text-[#09090B]">
                  <Circle size={16} className="text-brand shrink-0 mt-0.5 fill-brand stroke-[#09090B] stroke-2" />
                  <span>{origenDir}</span>
                </p>
                <p className="flex items-start gap-2 font-bold text-[#09090B]">
                  <Circle size={16} className="text-alert shrink-0 mt-0.5 fill-alert stroke-[#09090B] stroke-2" />
                  <span>{destinoDir}</span>
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-3xl font-black text-[#09090B]">
                  ${viaje.precio_final.toLocaleString("es-AR")}
                </p>
                <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mt-1">
                  {viaje.metodo_pago}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="px-5 pb-2">
              <p className="bg-alert text-white font-bold p-2 text-sm border-2 border-[#09090B] rounded flex items-center gap-2">
                <AlertTriangle size={16} /> {error}
              </p>
            </div>
          )}

          <div className="px-5 pb-5">
            {estado === "ACEPTADO" ? (
              <button
                onClick={handleLlegue}
                disabled={procesando}
                className="w-full min-h-[64px] rounded-xl font-black text-xl bg-brand text-[#09090B] border-4 border-[#09090B] shadow-[4px_4px_0px_0px_#09090B] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#09090B] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <CheckCircle size={24} />
                {procesando ? "CONFIRMANDO..." : "LLEGUÉ AL ORIGEN"}
              </button>
            ) : (
              <button
                onClick={handleFinalizar}
                disabled={procesando}
                className="w-full min-h-[64px] rounded-xl font-black text-xl bg-info text-white border-4 border-[#09090B] shadow-[4px_4px_0px_0px_#09090B] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#09090B] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <Flag size={24} />
                {procesando ? "FINALIZANDO..." : "FINALIZAR VIAJE"}
              </button>
            )}

            <div className="mt-5 text-center">
              <button
                onClick={handleCancelar}
                disabled={procesando}
                className={`font-black text-sm transition-all px-4 py-2 rounded-lg border-2 border-transparent flex items-center justify-center gap-2 mx-auto ${confirmarCancelacion
                  ? "bg-alert border-[#09090B] text-[#09090B] shadow-[2px_2px_0px_0px_#09090B]"
                  : "text-gray-500 hover:text-[#09090B]"
                  }`}
              >
                {confirmarCancelacion ? (
                  <>
                    <AlertTriangle size={16} /> ¿SEGURO? TOCÁ PARA CANCELAR
                  </>
                ) : (
                  <>
                    <X size={16} /> CANCELAR VIAJE
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