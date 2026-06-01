"use client";

/**
 * app/viaje/[id_viaje]/finalizar/FinalizarViajeClient.tsx
 * -----------------------------------------------------------------------
 * Pantalla de resumen y confirmación de fin de viaje.
 * 1) Muestra resumen del viaje (precio, método de pago, ruta)
 * 2) CTA "CONFIRMAR FINALIZACIÓN" → llama a finalizarViaje Server Action
 * 3) Al éxito → navega a /viaje/[id]/calificar
 * -----------------------------------------------------------------------
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { finalizarViaje } from "@/app/actions/conductor/finalizarViaje";

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
    <main
      className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950"
    >
      <div
        className="w-full max-w-md rounded-3xl border-4 border-zinc-950 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_#09090b] overflow-hidden"
      >
        {/* ── Encabezado ──────────────────────────────────────── */}
        <div
          className="px-6 py-5 border-b-4 border-zinc-950 dark:border-zinc-800 text-center bg-zinc-950 dark:bg-info"
        >
          <p className="text-4xl mb-2" aria-hidden>🏁</p>
          <h1 className="text-xl font-extrabold text-white dark:text-zinc-950">Resumen del viaje</h1>
          <p className="text-sm font-bold text-zinc-300 dark:text-zinc-950 mt-1">Confirmá la finalización para procesar el cobro</p>
        </div>

        {/* ── Resumen financiero ───────────────────────────────── */}
        <div className="px-6 py-6 space-y-4">
          {/* Precio destacado */}
          <div className="text-center py-4">
            <p className="text-6xl font-black text-zinc-950 dark:text-white tracking-tight">
              ${precioFinal.toLocaleString("es-AR")}
            </p>
            <p className="text-sm mt-2 font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">
              A cobrar
            </p>
          </div>

          {/* Línea divisoria */}
          <div className="border-t-2 border-zinc-200 dark:border-zinc-800" />

          {/* Detalles */}
          <dl className="space-y-3">
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
              <div key={label} className="flex justify-between items-center">
                <dt className="text-sm font-bold text-zinc-600 dark:text-zinc-400">{label}</dt>
                <dd className="font-black text-sm text-zinc-950 dark:text-white">{value}</dd>
              </div>
            ))}
          </dl>

          {/* Aviso si es efectivo */}
          {metodoPago === "EFECTIVO" && (
            <div
              className="rounded-xl p-3 flex items-start gap-2 text-sm border-2 border-zinc-950 bg-brand text-zinc-950 font-bold shadow-[2px_2px_0px_0px_#09090b] dark:bg-brand dark:text-zinc-950"
              role="note"
            >
              <span className="shrink-0">💡</span>
              <p>Recordá cobrar el efectivo al pasajero antes de confirmar.</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 font-medium text-center" role="alert">{error}</p>
          )}

          {/* ── CTA Principal ──────────────────────────────────── */}
          <button
            onClick={handleFinalizar}
            disabled={procesando}
            aria-label="Confirmar finalización del viaje y procesar el cobro"
            className="w-full min-h-[64px] rounded-xl font-black text-xl bg-brand text-zinc-950 border-4 border-zinc-950 shadow-[4px_4px_0px_0px_#09090b] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#09090b] transition-all active:translate-y-0 active:shadow-none focus:outline-none focus:ring-4 focus:ring-brand/50 disabled:opacity-60 flex items-center justify-center gap-2 mt-6"
          >
            {procesando ? (
              <>
                <span className="w-5 h-5 border-4 border-t-transparent rounded-full animate-spin border-zinc-950" />
                PROCESANDO...
              </>
            ) : (
              "✓ CONFIRMAR"
            )}
          </button>

          {/* Cancelar (volver sin finalizar) */}
          <button
            onClick={() => router.back()}
            disabled={procesando}
            className="w-full py-3 text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white uppercase tracking-widest transition-colors focus:outline-none"
          >
            Volver al mapa
          </button>
        </div>
      </div>
    </main>
  );
}
