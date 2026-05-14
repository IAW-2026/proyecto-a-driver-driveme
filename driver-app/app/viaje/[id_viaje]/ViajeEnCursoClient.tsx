"use client";

/**
 * app/viaje/[id_viaje]/ViajeEnCursoClient.tsx
 * -----------------------------------------------------------------------
 * Client Component — Pantalla principal durante un viaje activo.
 *
 * Responsabilidades:
 *  - Polling de telemetría cada 8s para mover al conductor en el mapa
 *  - Botón "LLEGUÉ" (ACEPTADO → EN_CURSO) y "FINALIZAR VIAJE" (EN_CURSO → redirige)
 *  - Mapa fullscreen con overlay de datos del pasajero
 *  - Importa MapaViaje dinámicamente (SSR false por restricción de Leaflet)
 * -----------------------------------------------------------------------
 */

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { iniciarViaje } from "@/app/actions/conductor";

// Leaflet requiere el DOM → importación dinámica sin SSR
const MapaViaje = dynamic(() => import("@/app/components/MapaViaje"), {
  ssr: false,
  loading: () => (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ backgroundColor: "var(--surface-muted)" }}
    >
      <div className="text-center space-y-2">
        <div
          className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mx-auto"
          style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
        />
        <p className="text-sm font-medium" style={{ color: "var(--muted)" }}>Cargando mapa...</p>
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
  // Datos del pasajero y ruta (vienen del response de Rider App)
  pasajero?: { nombre: string };
  origen?: { direccion: string; latitud: number; longitud: number };
  destino?: { direccion: string; latitud: number; longitud: number };
}

interface ViajeEnCursoClientProps {
  viaje: ViajeData;
  conductorId: string;
  // Fallback de coordenadas del conductor (de la BD)
  conductorLat: number;
  conductorLng: number;
}

export default function ViajeEnCursoClient({
  viaje,
  conductorId,
  conductorLat: latInicial,
  conductorLng: lngInicial,
}: ViajeEnCursoClientProps) {
  const router = useRouter();
  const [estado, setEstado] = useState(viaje.estado_actual);
  const [conductorLat, setConductorLat] = useState(latInicial);
  const [conductorLng, setConductorLng] = useState(lngInicial);
  const [procesando, setProcesando] = useState(false);
  const [confirmarCancelacion, setConfirmarCancelacion] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Coordenadas de origen/destino (con fallback para Bahía Blanca)
  const origenLat  = viaje.origen?.latitud  ?? -38.7183;
  const origenLng  = viaje.origen?.longitud ?? -62.2664;
  const destinoLat = viaje.destino?.latitud  ?? -38.7021;
  const destinoLng = viaje.destino?.longitud ?? -62.2801;

  // ── Polling de telemetría (cada 8s) ──────────────────────────────────
  const fetchTelemetria = useCallback(async () => {
    try {
      const res = await fetch(`/api/viajes/${viaje.id}/telemetria`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.coordenadas) {
        setConductorLat(data.coordenadas.lat);
        setConductorLng(data.coordenadas.lng);
      }
    } catch {
      // Pérdida temporal de red — silencioso
    }
  }, [viaje.id]);

  useEffect(() => {
    if (estado !== "EN_CURSO") return;
    const intervalo = setInterval(fetchTelemetria, 8000);
    return () => clearInterval(intervalo);
  }, [estado, fetchTelemetria]);

  // ── Llegué al origen: ACEPTADO → EN_CURSO ────────────────────────────
  const handleLlegue = async () => {
    setProcesando(true);
    setError(null);
    const result = await iniciarViaje(viaje.id);
    if (result.success) {
      setEstado("EN_CURSO");
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([50, 30, 50]);
    } else {
      setError(result.error ?? "Error al iniciar el viaje.");
    }
    setProcesando(false);
  };

  // ── Finalizar: redirige a la pantalla de resumen/cobro ───────────────
  const handleFinalizar = () => {
    router.push(`/viaje/${viaje.id}/finalizar`);
  };

  // ── Cancelar Viaje ───────────────────────────────────────────────────
  const handleCancelar = async () => {
    if (!confirmarCancelacion) {
      setConfirmarCancelacion(true);
      setTimeout(() => setConfirmarCancelacion(false), 3000); // Reset after 3s
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
  const origenDir  = viaje.origen?.direccion  ?? "Punto de origen";
  const destinoDir = viaje.destino?.direccion ?? "Punto de destino";

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ backgroundColor: "var(--background)" }}>

      {/* ── MAPA (fondo fullscreen) ────────────────────────────────── */}
      <div className="absolute inset-0">
        <MapaViaje
          origenLat={origenLat}   origenLng={origenLng}
          destinoLat={destinoLat} destinoLng={destinoLng}
          conductorLat={conductorLat} conductorLng={conductorLng}
          estado={estado}
        />
      </div>

      {/* ── OVERLAY SUPERIOR: Estado del viaje ────────────────────── */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-safe z-[1000]">
        <div
          className="rounded-2xl shadow-xl p-3 md:p-4 border"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xl"
                style={{ backgroundColor: "var(--accent)", color: "var(--text-inverted)" }}
                aria-hidden
              >
                {estado === "ACEPTADO" ? "📍" : "🚗"}
              </div>
              <div>
                <p className="font-extrabold text-base md:text-lg leading-tight" style={{ color: "var(--foreground)" }}>
                  {estado === "ACEPTADO" ? `Yendo a buscar a ${nombrePasajero}` : `Llevando a ${nombrePasajero}`}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  {estado === "ACEPTADO" ? origenDir : destinoDir}
                </p>
              </div>
            </div>
            {/* Badge de estado */}
            <span
              className="px-3 py-1 rounded-full text-xs font-extrabold tracking-wide shrink-0"
              style={
                estado === "ACEPTADO"
                  ? { backgroundColor: "#ECC94B22", color: "#744210" }
                  : { backgroundColor: "var(--accent)22", color: "var(--accent)" }
              }
            >
              {estado === "ACEPTADO" ? "YENDO AL ORIGEN" : "EN CURSO"}
            </span>
          </div>
        </div>
      </div>

      {/* ── OVERLAY INFERIOR: Datos + Botón de acción ─────────────── */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-safe z-[1000]">
        <div
          className="rounded-2xl shadow-xl border overflow-hidden"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          {/* Datos ruta */}
          <div className="px-4 pt-4 pb-3 space-y-2">
            <div className="flex justify-between items-start">
              <div className="space-y-1.5 text-sm flex-1 mr-4" style={{ color: "var(--muted)" }}>
                <p className="flex items-start gap-2">
                  <span className="text-green-500 font-extrabold shrink-0 mt-0.5">●</span>
                  <span style={{ color: "var(--foreground)" }}>{origenDir}</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-red-500 font-extrabold shrink-0 mt-0.5">●</span>
                  <span style={{ color: "var(--foreground)" }}>{destinoDir}</span>
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-extrabold" style={{ color: "var(--foreground)" }}>
                  ${viaje.precio_final.toLocaleString("es-AR")}
                </p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{viaje.metodo_pago}</p>
              </div>
            </div>
          </div>

          {/* Error inline */}
          {error && (
            <p className="px-4 pb-2 text-sm font-medium text-red-500" role="alert">{error}</p>
          )}

          {/* CTA principal */}
          <div className="px-4 pb-4">
            {estado === "ACEPTADO" ? (
              <button
                onClick={handleLlegue}
                disabled={procesando}
                aria-label="Confirmar que llegué al punto de recogida del pasajero"
                className="w-full min-h-[64px] rounded-2xl font-extrabold text-xl transition-all active:scale-[0.98] focus:outline-none focus:ring-4 disabled:opacity-60 shadow-lg"
                style={{ backgroundColor: "var(--accent)", color: "var(--text-inverted)" }}
              >
                {procesando ? "Confirmando..." : "📍 LLEGUÉ AL ORIGEN"}
              </button>
            ) : (
              <button
                onClick={handleFinalizar}
                disabled={procesando}
                aria-label="Finalizar el viaje y proceder al cobro"
                className="w-full min-h-[64px] rounded-2xl font-extrabold text-xl transition-all active:scale-[0.98] focus:outline-none focus:ring-4 disabled:opacity-60 shadow-lg"
                style={{ backgroundColor: "#B794F4", color: "var(--text-inverted)" }}
              >
                {procesando ? "Finalizando..." : "🏁 FINALIZAR VIAJE"}
              </button>
            )}

            {/* Botón Cancelar */}
            <div className="mt-4 text-center">
              <button
                onClick={handleCancelar}
                disabled={procesando}
                className={`text-sm font-bold transition-all focus:outline-none disabled:opacity-50 px-4 py-2 rounded-lg ${confirmarCancelacion ? "bg-red-100" : "hover:opacity-80"}`}
                style={{ color: "#E53E3E" }}
              >
                {confirmarCancelacion ? "⚠️ ¿Seguro? Tocá de nuevo para cancelar" : "✕ Cancelar viaje"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
