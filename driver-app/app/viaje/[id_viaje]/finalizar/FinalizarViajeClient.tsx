"use client";

/**
 * app/viaje/[id_viaje]/finalizar/FinalizarViajeClient.tsx
 * -----------------------------------------------------------------------
 * Pantalla de resumen y confirmación de fin de viaje.
 * -----------------------------------------------------------------------
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { finalizarViaje } from "@/app/actions/conductor/finalizarViaje";
import { formatARS } from "@/lib/formatters";
import { Flag, Lightbulb, AlertTriangle, CheckCircle2 } from "lucide-react";

interface FinalizarViajeClientProps {
  idViaje: string;
  precioFinal: number;
  metodoPago: string;
  tiempoAceptado: string;
  tiempoComienzo: string | null;
}

function formatDuracion(inicio: string | null, fin = new Date().toISOString()): string {
  if (!inicio) return "—";
  const diff = new Date(fin).getTime() - new Date(inicio).getTime();
  const minutos = Math.round(diff / 60000);
  if (minutos < 60) return `${minutos} min`;
  return `${Math.floor(minutos / 60)}h ${minutos % 60}min`;
}

export default function FinalizarViajeClient({
  idViaje,
  precioFinal,
  metodoPago,
  tiempoAceptado,
  tiempoComienzo,
}: FinalizarViajeClientProps) {
  const router = useRouter();
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFinalizar = async () => {
    setProcesando(true);
    setError(null);
    const result = await finalizarViaje(idViaje);
    if (result.success) {
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([50, 30, 100]);
      router.push(`/viaje/${idViaje}/calificar`);
    } else {
      setError(result.error ?? "Error al finalizar el viaje.");
      setProcesando(false);
    }
  };

  const duracion = formatDuracion(tiempoComienzo);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#050505]">
      <div className="w-full max-w-md rounded-modal border border-[rgba(220,38,38,0.15)] bg-[#141414] shadow-[0_0_40px_rgba(220,38,38,0.08)] overflow-hidden">
        
        {/* ── Encabezado ──────────────────────────────────────── */}
        <div className="px-6 py-6 border-b border-[rgba(220,38,38,0.15)] text-center bg-gradient-to-b from-[#1A0505] to-[#141414]">
          <div className="w-16 h-16 mx-auto bg-gradient-to-b from-primary-hover to-primary rounded-full flex items-center justify-center border-2 border-primary-dark shadow-[0_0_20px_rgba(220,38,38,0.3)] mb-4">
            <Flag size={28} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-extrabold text-white uppercase tracking-wide">Resumen del viaje</h1>
          <p className="text-xs font-bold text-[#9CA3AF] mt-1 uppercase tracking-[0.2em]">Confirmá la finalización para procesar el cobro</p>
        </div>

        {/* ── Resumen financiero ───────────────────────────────── */}
        <div className="px-6 py-8 space-y-6">
          {/* Precio destacado */}
          <div className="flex flex-col items-center justify-center bg-[#0A0A0A] p-6 rounded-card border border-[rgba(255,255,255,0.06)] shadow-inner w-full overflow-hidden">
            <p className="text-5xl sm:text-6xl font-black text-white tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] w-full text-center break-words">
              {formatARS(precioFinal)}
            </p>
            <p className="text-xs mt-2 font-extrabold text-red-400 uppercase tracking-[0.3em] text-center w-full">
              A cobrar
            </p>
          </div>

          {/* Detalles */}
          <div className="space-y-4 px-2">
            {[
              { label: "Método de pago", value: metodoPago === "EFECTIVO" ? "💵 Efectivo" : "💳 Tarjeta" },
              { label: "Duración del viaje", value: duracion },
              {
                label: "Iniciado",
                value: tiempoComienzo
                  ? new Date(tiempoComienzo).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
                  : "—",
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-3 last:border-0 last:pb-0">
                <span className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">{label}</span>
                <span className="font-extrabold text-sm text-white uppercase tracking-wide">{value}</span>
              </div>
            ))}
          </div>

          {/* Aviso si es efectivo */}
          {metodoPago === "EFECTIVO" && (
            <div className="rounded-sharp p-4 flex items-start gap-3 border border-[rgba(234,179,8,0.3)] bg-[rgba(234,179,8,0.1)] text-[#FCD34D] shadow-[0_0_15px_rgba(234,179,8,0.05)]">
              <Lightbulb size={20} className="shrink-0 text-yellow-500" strokeWidth={2.5} />
              <p className="text-sm font-bold leading-tight">
                Recordá cobrar el efectivo al pasajero antes de confirmar.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-sharp p-3 flex items-start gap-2 border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] text-[#EF4444] font-bold text-sm">
              <AlertTriangle size={18} className="shrink-0" strokeWidth={2.5} />
              <p>{error}</p>
            </div>
          )}

          {/* ── CTA Principal ──────────────────────────────────── */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleFinalizar}
              disabled={procesando}
              className="w-full min-h-[64px] rounded-sharp font-black text-lg tracking-widest uppercase bg-gradient-to-b from-primary-hover to-primary text-white border border-primary-dark shadow-[0_0_20px_rgba(220,38,38,0.2)] hover:translate-y-[-1px] hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {procesando ? (
                <>
                  <span className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin border-white" />
                  PROCESANDO...
                </>
              ) : (
                <>
                  <CheckCircle2 size={24} strokeWidth={2.5} />
                  CONFIRMAR
                </>
              )}
            </button>

            <button
              onClick={() => router.back()}
              disabled={procesando}
              className="w-full py-4 text-xs font-bold text-[#9CA3AF] hover:text-white uppercase tracking-[0.2em] transition-colors focus:outline-none"
            >
              VOLVER AL MAPA
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
