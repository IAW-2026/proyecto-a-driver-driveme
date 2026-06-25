/**
 * app/not-found.tsx
 * Global 404 page — Server Component.
 * Dark Sci-Fi aesthetic — Lost Signal styling.
 */
import Link from "next/link";
import { Home, MapPinOff } from "lucide-react";

export const metadata = {
  title: "404 — Señal Perdida · DriveMe",
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-[#050505] font-sans">
      <div className="w-full max-w-lg">
        
        {/* Número 404 decorativo */}
        <div className="relative mb-8">
          <p
            className="text-[10rem] md:text-[13rem] font-black leading-none tracking-tighter text-center text-[#141414] select-none pointer-events-none drop-shadow-[0_0_15px_rgba(220,38,38,0.1)]"
            aria-hidden
          >
            404
          </p>
          {/* Icono superpuesto */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-[#141414] border border-[rgba(239,68,68,0.3)] shadow-[0_0_30px_rgba(239,68,68,0.2)] p-4 rounded-sharp">
              <MapPinOff className="w-12 h-12 text-[#EF4444]" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Card de mensaje */}
        <div className="rounded-modal border border-[rgba(220,38,38,0.15)] bg-[rgba(20,20,20,0.8)] backdrop-blur-sm shadow-[0_0_40px_rgba(220,38,38,0.1)] p-8 text-center space-y-4">
          
          <span className="inline-block px-3 py-1 rounded-sharp border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] text-[#EF4444] text-[10px] font-extrabold uppercase tracking-[0.2em]">
            Señal Perdida
          </span>

          <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-white">
            Sector Desconocido
          </h1>

          <p className="text-[#9CA3AF] font-medium text-sm leading-relaxed">
            Las coordenadas que buscás no existen en la red o fueron reubicadas.
            <br />
            Retorná al mando central para recalibrar tu ruta.
          </p>

          {/* Botón de acción */}
          <div className="pt-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-sharp border border-[#991B1B] bg-gradient-to-b from-[#EF4444] to-[#DC2626] text-white font-extrabold text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:translate-y-[-1px] hover:shadow-[0_0_25px_rgba(239,68,68,0.3)] transition-all active:scale-[0.98] focus:outline-none"
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
