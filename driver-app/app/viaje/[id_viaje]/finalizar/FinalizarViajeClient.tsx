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
import { finalizarViaje } from "@/app/actions/conductor";

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
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div
        className="w-full max-w-md rounded-3xl shadow-xl border overflow-hidden"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        {/* ── Encabezado ──────────────────────────────────────── */}
        <div
          className="px-6 py-5 border-b text-center"
          style={{ background: "var(--gradient-primary)", borderColor: "var(--border)" }}
        >
          <p className="text-4xl mb-2" aria-hidden>🏁</p>
          <h1 className="text-xl font-extrabold text-white">Resumen del viaje</h1>
          <p className="text-sm text-white/80 mt-1">Confirmá la finalización para procesar el cobro</p>
        </div>

        {/* ── Resumen financiero ───────────────────────────────── */}
        <div className="px-6 py-6 space-y-4">
          {/* Precio destacado */}
          <div className="text-center py-4">
            <p className="text-6xl font-extrabold tracking-tight" style={{ color: "var(--foreground)" }}>
              ${precioFinal.toLocaleString("es-AR")}
            </p>
            <p className="text-sm mt-2 font-medium" style={{ color: "var(--muted)" }}>
              A cobrar
            </p>
          </div>

          {/* Línea divisoria */}
          <div className="border-t" style={{ borderColor: "var(--border)" }} />

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
                <dt className="text-sm" style={{ color: "var(--muted)" }}>{label}</dt>
                <dd className="font-bold text-sm" style={{ color: "var(--foreground)" }}>{value}</dd>
              </div>
            ))}
          </dl>

          {/* Aviso si es efectivo */}
          {metodoPago === "EFECTIVO" && (
            <div
              className="rounded-xl p-3 flex items-start gap-2 text-sm"
              style={{ backgroundColor: "#ECC94B22", color: "#744210" }}
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
            className="w-full min-h-[64px] rounded-2xl font-extrabold text-xl transition-all active:scale-[0.98] focus:outline-none focus:ring-4 disabled:opacity-60 shadow-lg mt-2"
            style={{ background: "var(--gradient-primary)", color: "white" }}
          >
            {procesando ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin border-white" />
                Procesando cobro...
              </span>
            ) : (
              "✓ CONFIRMAR FINALIZACIÓN"
            )}
          </button>

          {/* Cancelar (volver sin finalizar) */}
          <button
            onClick={() => router.back()}
            disabled={procesando}
            className="w-full py-3 text-sm font-medium transition-colors focus:outline-none"
            style={{ color: "var(--muted)" }}
          >
            Volver al mapa
          </button>
        </div>
      </div>
    </div>
  );
}
