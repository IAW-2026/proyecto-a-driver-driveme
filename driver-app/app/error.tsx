"use client";

/**
 * app/error.tsx
 * Global error boundary — Client Component (required by Next.js).
 * Catches unexpected runtime errors thrown in any route segment.
 * Props injected automatically by Next.js:
 *   - error: the thrown Error object (may include a .digest for server errors)
 *   - reset: function that re-renders the failed segment to retry
 */
import { useEffect } from "react";
import Link from "next/link";
import { Home, RefreshCw, AlertTriangle } from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  // Log to the console so the dev sees it (in production, send to your error tracker)
  useEffect(() => {
    console.error("[GlobalError boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-zinc-50 dark:bg-zinc-950 font-sans">

      {/* ── Card principal ── */}
      <div className="w-full max-w-lg">

        {/* Número decorativo */}
        <div className="relative mb-6">
          <p
            className="text-[10rem] md:text-[13rem] font-black leading-none tracking-tighter text-center
              text-zinc-100 dark:text-zinc-900 select-none pointer-events-none"
            aria-hidden
          >
            500
          </p>
          {/* Icono superpuesto */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-alert border-4 border-zinc-950 dark:border-alert shadow-[6px_6px_0px_0px_#09090b] dark:shadow-[6px_6px_0px_0px_#FF007F] p-4 rounded-2xl rotate-3">
              <AlertTriangle className="w-12 h-12 text-white" strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* Card de mensaje */}
        <div className="rounded-2xl border-4 border-zinc-950 dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_#09090b] dark:shadow-[8px_8px_0px_0px_#ffffff] p-8 text-center space-y-4">

          {/* Etiqueta de error */}
          <span className="inline-block px-3 py-1 rounded-lg border-2 border-zinc-950 dark:border-zinc-600 bg-alert text-white text-[10px] font-extrabold uppercase tracking-[0.2em]">
            Error inesperado
          </span>

          <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-zinc-950 dark:text-white">
            Algo salió mal
          </h1>

          <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm leading-relaxed">
            Ocurrió un error inesperado en la aplicación.
            <br />
            Podés intentar de nuevo o volver al inicio.
          </p>

          {/* Mensaje técnico (digest) — solo visible si existe */}
          {error.digest && (
            <p className="text-[11px] font-mono text-zinc-400 dark:text-zinc-600 break-all">
              Referencia: {error.digest}
            </p>
          )}

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {/* Primario: reintentar */}
            <button
              onClick={reset}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border-2 border-zinc-950 bg-alert text-white font-extrabold text-sm uppercase tracking-wide shadow-[4px_4px_0px_0px_#09090b] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#09090b] dark:shadow-[4px_4px_0px_0px_#FF007F] dark:hover:shadow-[6px_6px_0px_0px_#FF007F] active:translate-y-0 active:shadow-[2px_2px_0px_0px_#09090b] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-alert/40"
            >
              <RefreshCw className="w-4 h-4" strokeWidth={3} />
              Intentar de nuevo
            </button>

            {/* Secundario: ir al inicio */}
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border-2 border-zinc-950 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white font-extrabold text-sm uppercase tracking-wide shadow-[4px_4px_0px_0px_#09090b] dark:shadow-none hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#09090b] active:translate-y-0 transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-zinc-950/20"
            >
              <Home className="w-4 h-4" strokeWidth={3} />
              Volver al Inicio
            </Link>
          </div>
        </div>

        {/* Pie */}
        <p className="mt-6 text-center text-[11px] font-extrabold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
          DriveMe · Sistema de Gestión de Flota
        </p>
      </div>
    </div>
  );
}
