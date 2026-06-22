"use client";

/**
 * app/viaje/[id_viaje]/calificar/CalificarPasajeroClient.tsx
 * -----------------------------------------------------------------------
 * Pantalla de calificación del pasajero post-viaje.
 * -----------------------------------------------------------------------
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import NeonTextarea from "@/app/components/NeonTextarea";
import { enviarResenaAction } from "@/app/actions/conductor/enviarResena";
import { Star, AlertTriangle, Send, FastForward } from "lucide-react";

interface CalificarPasajeroClientProps {
  idViaje: string;
  idConductor: string;
  idPasajero: string;
  nombrePasajero?: string;
}

export default function CalificarPasajeroClient({
  idViaje,
  idConductor,
  idPasajero,
  nombrePasajero = "el pasajero",
}: CalificarPasajeroClientProps) {
  const router = useRouter();
  const [puntaje, setPuntaje] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnviar = async () => {
    if (puntaje === 0) {
      setError("Seleccioná al menos 1 estrella para continuar.");
      return;
    }
    setEnviando(true);
    setError(null);

    try {
      const result = await enviarResenaAction({
        id_viaje: idViaje,
        id_emisor: idConductor,
        id_receptor: idPasajero,
        puntaje,
        comentario: comentario.trim() || "Sin comentario.",
      });

      if (!result.success) {
        setError(result.error ?? "Error al enviar la calificación. Intentá de nuevo.");
        setEnviando(false);
        return;
      }

      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([50, 30, 100]);
      router.push("/historial");
    } catch {
      setError("Sin conexión. Verificá tu internet e intentá de nuevo.");
      setEnviando(false);
    }
  };

  const handleOmitir = () => router.push("/historial");

  const etiquetaEstrellas = ["", "Malo", "Regular", "Bueno", "Muy bueno", "Excelente"];
  const colorActivo = puntaje >= 4 ? "#FBBF24" : puntaje >= 2 ? "#F97316" : "#EF4444";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#050505]">
      <div className="w-full max-w-sm rounded-modal border border-[rgba(220,38,38,0.15)] bg-[#141414] shadow-[0_0_40px_rgba(220,38,38,0.08)] overflow-hidden">
        
        {/* ── Encabezado ──────────────────────────────────────── */}
        <div className="px-6 py-6 border-b border-[rgba(220,38,38,0.15)] text-center bg-gradient-to-b from-[#1A1A05] to-[#141414]">
          <div className="w-16 h-16 mx-auto bg-gradient-to-b from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center border-2 border-yellow-700 shadow-[0_0_20px_rgba(234,179,8,0.3)] mb-4">
            <Star size={32} className="text-[#050505] fill-[#050505]" strokeWidth={1} />
          </div>
          <h1 className="text-xl font-extrabold text-white uppercase tracking-wide">¡Misión Cumplida!</h1>
          <p className="text-xs font-bold text-[#9CA3AF] mt-1 uppercase tracking-widest">
            ¿Cómo estuvo {nombrePasajero}?
          </p>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* ── Selector de estrellas ─────────────────────────── */}
          <div className="text-center space-y-3">
            <div
              className="flex justify-center gap-2"
              role="group"
              aria-label="Calificación de 1 a 5 estrellas"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setPuntaje(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  aria-label={`${n} estrella${n > 1 ? "s" : ""} — ${etiquetaEstrellas[n]}`}
                  aria-pressed={puntaje === n}
                  className="w-12 h-12 flex items-center justify-center transition-transform active:scale-90 focus:outline-none rounded-sharp"
                >
                  <Star
                    size={40}
                    className="transition-all"
                    style={{
                      fill: n <= (hover || puntaje) ? colorActivo : "transparent",
                      color: n <= (hover || puntaje) ? colorActivo : "#6B7280",
                      filter: n <= (hover || puntaje) ? `drop-shadow(0 0 8px ${colorActivo}80)` : "none",
                    }}
                    strokeWidth={n <= (hover || puntaje) ? 1 : 2}
                  />
                </button>
              ))}
            </div>
            <div className="h-6">
              {puntaje > 0 && (
                <p
                  className="text-lg font-black uppercase tracking-widest transition-all"
                  style={{ color: colorActivo, textShadow: `0 0 10px ${colorActivo}40` }}
                  aria-live="polite"
                >
                  {etiquetaEstrellas[puntaje]}
                </p>
              )}
            </div>
          </div>

          {/* ── Comentario opcional ───────────────────────────── */}
          <div>
            <label
              htmlFor="comentario"
              className="block text-xs font-extrabold text-[#9CA3AF] uppercase tracking-widest mb-2"
            >
              Comentario <span className="text-[#9CA3AF] font-medium">(opcional)</span>
            </label>
            <NeonTextarea
              id="comentario"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={3}
              maxLength={280}
              placeholder="¿Querés agregar algo sobre este pasajero?"
              className="resize-none"
            />
            <p className="text-[10px] font-bold text-right mt-1 text-[#9CA3AF]">
              {comentario.length}/280
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-sharp p-3 flex items-start gap-2 border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] text-[#EF4444] font-bold text-sm">
              <AlertTriangle size={18} className="shrink-0" strokeWidth={2.5} />
              <p>{error}</p>
            </div>
          )}

          {/* ── Botones ───────────────────────────────────────── */}
          <div className="space-y-3">
            <button
              onClick={handleEnviar}
              disabled={enviando || puntaje === 0}
              aria-label="Enviar calificación del pasajero"
              className="w-full min-h-[60px] rounded-sharp border border-primary-dark bg-gradient-to-b from-primary-hover to-primary text-white font-extrabold text-sm uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(220,38,38,0.2)] hover:translate-y-[-1px] hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {enviando ? (
                <>
                  <span className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin border-white" />
                  Transmitiendo...
                </>
              ) : (
                <>
                  <Send size={18} strokeWidth={2.5} />
                  Enviar Reporte
                </>
              )}
            </button>

            <button
              onClick={handleOmitir}
              disabled={enviando}
              className="w-full min-h-[50px] rounded-sharp border border-[rgba(255,255,255,0.1)] bg-[#1F1F1F] text-[#9CA3AF] font-bold text-xs uppercase tracking-widest hover:bg-[#2A2A2A] hover:text-white transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              aria-label="Omitir calificación e ir al historial"
            >
              <FastForward size={16} strokeWidth={2.5} />
              Omitir por ahora
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
