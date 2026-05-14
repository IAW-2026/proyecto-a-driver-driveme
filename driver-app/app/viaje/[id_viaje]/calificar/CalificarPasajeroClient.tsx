"use client";

/**
 * app/viaje/[id_viaje]/calificar/CalificarPasajeroClient.tsx
 * -----------------------------------------------------------------------
 * Pantalla de calificación del pasajero post-viaje.
 * - Selector de estrellas táctil (1-5), tamaño mínimo 52px por estrella
 * - Campo de comentario opcional
 * - Envío a Feedback App (POST /api/resenas)
 * - Al éxito → redirige a /historial
 * -----------------------------------------------------------------------
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      const res = await fetch(`/api/resenas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_viaje:    idViaje,
          id_emisor:   idConductor,
          id_receptor: idPasajero,
          puntaje,
          comentario:  comentario.trim() || "Sin comentario.",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Error al enviar la calificación. Intentá de nuevo.");
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
  const colorActivo = puntaje >= 4 ? "#ECC94B" : puntaje >= 2 ? "#ED8936" : "#E53E3E";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div
        className="w-full max-w-sm rounded-3xl shadow-xl border overflow-hidden"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        {/* ── Encabezado ──────────────────────────────────────── */}
        <div
          className="px-6 py-6 text-center"
          style={{ background: "var(--gradient-primary)" }}
        >
          <p className="text-5xl mb-3" aria-hidden>⭐</p>
          <h1 className="text-xl font-extrabold text-white">¡Viaje completado!</h1>
          <p className="text-sm text-white/80 mt-1">
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
                  className="min-w-[52px] min-h-[52px] text-4xl transition-transform active:scale-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] rounded-xl"
                  style={{
                    color: n <= (hover || puntaje) ? colorActivo : "var(--border)",
                    filter: n <= (hover || puntaje) ? "drop-shadow(0 0 6px rgba(236,201,75,0.6))" : "none",
                  }}
                >
                  ★
                </button>
              ))}
            </div>
            {puntaje > 0 && (
              <p
                className="text-lg font-extrabold transition-all"
                style={{ color: colorActivo }}
                aria-live="polite"
              >
                {etiquetaEstrellas[puntaje]}
              </p>
            )}
          </div>

          {/* ── Comentario opcional ───────────────────────────── */}
          <div>
            <label
              htmlFor="comentario"
              className="block text-sm font-semibold mb-2"
              style={{ color: "var(--foreground)" }}
            >
              Comentario <span style={{ color: "var(--muted)" }}>(opcional)</span>
            </label>
            <textarea
              id="comentario"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={3}
              maxLength={280}
              placeholder="¿Querés agregar algo sobre este pasajero?"
              className="w-full border rounded-xl p-3 text-sm resize-none bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
            />
            <p className="text-xs text-right mt-1" style={{ color: "var(--muted)" }}>
              {comentario.length}/280
            </p>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 font-medium text-center" role="alert">{error}</p>
          )}

          {/* ── Botones ───────────────────────────────────────── */}
          <div className="space-y-3">
            <button
              onClick={handleEnviar}
              disabled={enviando || puntaje === 0}
              aria-label="Enviar calificación del pasajero"
              className="w-full min-h-[60px] rounded-2xl font-extrabold text-lg transition-all active:scale-[0.98] focus:outline-none focus:ring-4 disabled:opacity-50 shadow-lg"
              style={{ background: "var(--gradient-primary)", color: "white" }}
            >
              {enviando ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin border-white" />
                  Enviando...
                </span>
              ) : (
                "Enviar calificación"
              )}
            </button>

            <button
              onClick={handleOmitir}
              disabled={enviando}
              className="w-full py-3 text-sm font-medium transition-colors focus:outline-none"
              style={{ color: "var(--muted)" }}
              aria-label="Omitir calificación e ir al historial"
            >
              Omitir por ahora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
