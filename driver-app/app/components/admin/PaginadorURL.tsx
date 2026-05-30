// app/components/admin/PaginadorURL.tsx
"use client";

/**
 * PaginadorURL — Paginación neobrutalista basada en URL.
 * Lee los searchParams actuales y construye hrefs que preservan todos los filtros
 * al cambiar de página. Usa <Link> de Next.js para que las páginas se prefetcheen.
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

  /** Copia todos los searchParams actuales y sólo reemplaza `page`. */
  function crearHref(pagina: number): string {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(pagina));
    return `${pathname}?${params.toString()}`;
  }

  /** Genera el array de páginas visibles con "..." cuando hay muchas páginas. */
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
    "flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-extrabold uppercase tracking-wide transition-all duration-150";

  const btnActivo =
    "border-zinc-950 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-[2px_2px_0px_0px_#09090b] dark:shadow-none hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#09090b]";

  const btnDeshabilitado =
    "border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-400 opacity-50 cursor-not-allowed";

  const btnSiguiente =
    "border-zinc-950 dark:border-brand bg-brand dark:bg-zinc-900 text-zinc-950 dark:text-brand shadow-[2px_2px_0px_0px_#09090b] dark:shadow-[2px_2px_0px_0px_#CFFF04] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#09090b] dark:hover:shadow-[3px_3px_0px_0px_#CFFF04]";

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t-2 border-zinc-950 dark:border-zinc-700 pt-4 mt-4">
      {/* Contador */}
      <p className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
        Página {paginaActual} de {totalPaginas}
      </p>

      <div className="flex items-center gap-1.5">
        {/* ── Anterior ── */}
        {paginaActual > 1 ? (
          <Link href={crearHref(paginaActual - 1)} className={`${btnBase} ${btnActivo}`}>
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={3} />
            Anterior
          </Link>
        ) : (
          <span className={`${btnBase} ${btnDeshabilitado}`} aria-disabled="true">
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={3} />
            Anterior
          </span>
        )}

        {/* ── Números de página (solo desktop) ── */}
        <div className="hidden sm:flex items-center gap-1">
          {paginasVisibles().map((p, i) =>
            p === "..." ? (
              <span
                key={`ellipsis-${i}`}
                className="w-8 text-center text-xs font-bold text-zinc-400 dark:text-zinc-600"
              >
                …
              </span>
            ) : (
              <Link
                key={p}
                href={crearHref(p as number)}
                aria-current={paginaActual === p ? "page" : undefined}
                className={`w-8 h-8 flex items-center justify-center rounded-lg border-2 text-xs font-extrabold transition-all duration-150 ${
                  paginaActual === p
                    ? "bg-zinc-950 text-white border-zinc-950 shadow-[2px_2px_0px_0px_#09090b] dark:bg-brand dark:text-zinc-950 dark:border-brand dark:shadow-[2px_2px_0px_0px_#CFFF04]"
                    : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-950 dark:hover:border-zinc-500 hover:-translate-y-0.5"
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
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={3} />
          </Link>
        ) : (
          <span className={`${btnBase} ${btnDeshabilitado}`} aria-disabled="true">
            Siguiente
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={3} />
          </span>
        )}
      </div>
    </div>
  );
}
