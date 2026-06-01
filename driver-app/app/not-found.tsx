/**
 * app/not-found.tsx
 * Global 404 page — Server Component.
 * Rendered automatically by Next.js when notFound() is called or a route doesn't exist.
 */
import Link from "next/link";
import { Home, MapPin } from "lucide-react";

export const metadata = {
  title: "404 — Página no encontrada · DriveMe",
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-zinc-50 dark:bg-zinc-950 font-sans">

      {/* ── Card principal ── */}
      <div className="w-full max-w-lg">

        {/* Número 404 decorativo */}
        <div className="relative mb-6">
          <p
            className="text-[10rem] md:text-[13rem] font-black leading-none tracking-tighter text-center
              text-zinc-100 dark:text-zinc-900 select-none pointer-events-none"
            aria-hidden
          >
            404
          </p>
          {/* Icono superpuesto */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-brand border-4 border-zinc-950 dark:border-brand shadow-[6px_6px_0px_0px_#09090b] dark:shadow-[6px_6px_0px_0px_#CFFF04] p-4 rounded-2xl -rotate-3">
              <MapPin className="w-12 h-12 text-zinc-950" strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* Card de mensaje */}
        <div className="rounded-2xl border-4 border-zinc-950 dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_#09090b] dark:shadow-[8px_8px_0px_0px_#ffffff] p-8 text-center space-y-4">

          {/* Etiqueta de error */}
          <span className="inline-block px-3 py-1 rounded-lg border-2 border-zinc-950 dark:border-zinc-600 bg-zinc-950 dark:bg-zinc-800 text-brand text-[10px] font-extrabold uppercase tracking-[0.2em]">
            Error 404
          </span>

          <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-zinc-950 dark:text-white">
            Página no encontrada
          </h1>

          <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm leading-relaxed">
            La ruta que buscás no existe o fue movida.
            <br />
            Volvé al inicio para retomar tu recorrido.
          </p>

          {/* Botón de acción */}
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border-2 border-zinc-950 bg-brand text-zinc-950 font-extrabold text-sm uppercase tracking-wide shadow-[4px_4px_0px_0px_#09090b] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#09090b] active:translate-y-0 active:shadow-[2px_2px_0px_0px_#09090b] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-brand/40"
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
