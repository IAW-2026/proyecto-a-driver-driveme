"use client";

/**
 * app/error.tsx
 * Global error boundary — Client Component.
 * Dark Sci-Fi aesthetic — System Failure warning.
 */
import { useEffect } from "react";
import Link from "next/link";
import { Home, RefreshCw, AlertTriangle } from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[GlobalError boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-[#050505] font-sans">
      <div className="w-full max-w-lg">
        
        {/* Número decorativo */}
        <div className="relative mb-8">
          <p
            className="text-[10rem] md:text-[13rem] font-black leading-none tracking-tighter text-center text-[#141414] select-none pointer-events-none drop-shadow-[0_0_15px_rgba(220,38,38,0.1)]"
            aria-hidden
          >
            500
          </p>
          {/* Icono superpuesto */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-[#141414] border border-[rgba(239,68,68,0.3)] shadow-[0_0_30px_rgba(239,68,68,0.2)] p-4 rounded-sharp">
              <AlertTriangle className="w-12 h-12 text-[#EF4444]" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Card de mensaje */}
        <div className="rounded-modal border border-[rgba(220,38,38,0.15)] bg-[rgba(20,20,20,0.8)] backdrop-blur-sm shadow-[0_0_40px_rgba(220,38,38,0.1)] p-8 text-center space-y-4">
          
          <span className="inline-block px-3 py-1 rounded-sharp border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] text-[#EF4444] text-[10px] font-extrabold uppercase tracking-[0.2em]">
            Falla del Sistema
          </span>

          <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-white">
            Algo salió mal
          </h1>

          <p className="text-[#9CA3AF] font-medium text-sm leading-relaxed">
            Se ha detectado una anomalía inesperada en el enlace.
            <br />
            Podés intentar reiniciar el proceso o volver al mando central.
          </p>

          {error.digest && (
            <p className="text-[10px] font-mono text-[#6B7280] break-all border-t border-[rgba(255,255,255,0.06)] pt-4 mt-4">
              REF: {error.digest}
            </p>
          )}

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={reset}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-sharp border border-[#991B1B] bg-gradient-to-b from-[#EF4444] to-[#DC2626] text-white font-extrabold text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:translate-y-[-1px] hover:shadow-[0_0_25px_rgba(239,68,68,0.3)] transition-all active:scale-[0.98] focus:outline-none"
            >
              <RefreshCw className="w-4 h-4" strokeWidth={2.5} />
              Reiniciar Enlace
            </button>

            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-sharp border border-[rgba(255,255,255,0.1)] bg-[#1F1F1F] text-[#9CA3AF] font-bold text-xs uppercase tracking-widest hover:text-white hover:bg-[#2A2A2A] transition-all active:scale-[0.98] focus:outline-none"
            >
              <Home className="w-4 h-4" strokeWidth={2.5} />
              Centro de Mando
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#4B5563]">
          DriveMe · Mando Central v1.0
        </p>
      </div>
    </div>
  );
}
