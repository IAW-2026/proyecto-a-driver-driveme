// app/components/admin/PaginadorURL.tsx
"use client";

/**
 * PaginadorURL — Paginación Dark Sci-Fi basada en URL.
 */
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginadorURLProps {
  paginaActual: number;
  totalPaginas: number;
}

export default function PaginadorURL({ paginaActual, totalPaginas }: PaginadorURLProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPaginas <= 1) return null;

  function crearHref(pagina: number): string {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(pagina));
    return `${pathname}?${params.toString()}`;
  }

  function paginasVisibles(): (number | "...")[] {
    if (totalPaginas <= 7) {
      return Array.from({ length: totalPaginas }, (_, i) => i + 1);
    }
    if (paginaActual <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPaginas];
    }
    if (paginaActual >= totalPaginas - 3) {
      return [
        1,
        "...",
        totalPaginas - 4,
        totalPaginas - 3,
        totalPaginas - 2,
        totalPaginas - 1,
        totalPaginas,
      ];
    }
    return [
      1,
      "...",
      paginaActual - 1,
      paginaActual,
      paginaActual + 1,
      "...",
      totalPaginas,
    ];
  }

  const btnBase =
    "flex items-center gap-1.5 px-3 py-2 rounded-sharp border text-xs font-extrabold uppercase tracking-widest transition-all duration-150";

  const btnActivo =
    "bg-[rgba(220,38,38,0.15)] border-[rgba(220,38,38,0.3)] text-primary shadow-[0_0_15px_rgba(220,38,38,0.2)]";

  const btnInactivo =
    "bg-transparent border-transparent text-[#9CA3AF] hover:text-white hover:bg-[#1F1F1F] hover:border-[rgba(255,255,255,0.1)]";

  const btnDeshabilitado =
    "bg-transparent border-transparent text-[#4B5563] opacity-50 cursor-not-allowed";

  const btnSiguiente =
    "bg-gradient-to-b from-[#1F1F1F] to-[#0A0A0A] border-[rgba(255,255,255,0.1)] text-[#9CA3AF] hover:text-white hover:border-primary/40 hover:shadow-[0_0_15px_rgba(220,38,38,0.15)]";

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[rgba(255,255,255,0.06)] pt-4 mt-4">
      {/* Contador */}
      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#6B7280]">
        Página {paginaActual} / {totalPaginas}
      </p>

      <div className="flex items-center gap-1.5">
        {/* ── Anterior ── */}
        {paginaActual > 1 ? (
          <Link href={crearHref(paginaActual - 1)} className={`${btnBase} ${btnSiguiente}`}>
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
            Anterior
          </Link>
        ) : (
          <span className={`${btnBase} ${btnDeshabilitado}`} aria-disabled="true">
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
            Anterior
          </span>
        )}

        {/* ── Números de página (solo desktop) ── */}
        <div className="hidden sm:flex items-center gap-1">
          {paginasVisibles().map((p, i) =>
            p === "..." ? (
              <span
                key={`ellipsis-${i}`}
                className="w-8 text-center text-[10px] font-bold text-[#4B5563]"
              >
                …
              </span>
            ) : (
              <Link
                key={p}
                href={crearHref(p as number)}
                aria-current={paginaActual === p ? "page" : undefined}
                className={`w-8 h-8 flex items-center justify-center rounded-sharp border text-xs font-extrabold transition-all duration-150 ${
                  paginaActual === p ? btnActivo : btnInactivo
                }`}
              >
                {p}
              </Link>
            )
          )}
        </div>

        {/* ── Siguiente ── */}
        {paginaActual < totalPaginas ? (
          <Link href={crearHref(paginaActual + 1)} className={`${btnBase} ${btnSiguiente}`}>
            Siguiente
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
          </Link>
        ) : (
          <span className={`${btnBase} ${btnDeshabilitado}`} aria-disabled="true">
            Siguiente
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
          </span>
        )}
      </div>
    </div>
  );
}
