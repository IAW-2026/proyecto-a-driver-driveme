// app/components/admin/AdminTabla.tsx
import React from "react";

interface ColumnaTabla<T> {
  cabecera: string;
  /** Key del objeto o función render personalizado */
  render: (fila: T) => React.ReactNode;
  /** Clases extra para la celda (opcional) */
  className?: string;
}

interface AdminTablaProps<T> {
  columnas: ColumnaTabla<T>[];
  filas: T[];
  /** Key única por fila */
  keyExtractor: (fila: T) => string;
  /** Mensaje cuando no hay datos */
  mensajeVacio?: string;
}

/**
 * AdminTabla — Tabla neobrutalista, responsive y reutilizable.
 * En mobile cada fila se transforma en una "tarjeta" de columnas apiladas.
 */
export default function AdminTabla<T>({
  columnas,
  filas,
  keyExtractor,
  mensajeVacio = "No hay datos para mostrar.",
}: AdminTablaProps<T>) {
  if (filas.length === 0) {
    return (
      <div className="py-16 text-center text-zinc-500 dark:text-zinc-400 font-semibold">
        {mensajeVacio}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      {/* ── Desktop Table ─────────────────────────────────────── */}
      <table className="hidden md:table w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-zinc-950 dark:border-zinc-700">
            {columnas.map((col) => (
              <th
                key={col.cabecera}
                className={`py-3 px-4 text-left font-extrabold uppercase tracking-widest text-[10px] text-zinc-600 dark:text-zinc-400 ${col.className ?? ""}`}
              >
                {col.cabecera}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr
              key={keyExtractor(fila)}
              className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors duration-150"
            >
              {columnas.map((col) => (
                <td
                  key={col.cabecera}
                  className={`py-3 px-4 font-medium text-zinc-950 dark:text-white ${col.className ?? ""}`}
                >
                  {col.render(fila)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Mobile Cards ──────────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {filas.map((fila) => (
          <div
            key={keyExtractor(fila)}
            className="rounded-xl border-2 border-zinc-950 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-[3px_3px_0px_0px_#09090b] dark:shadow-none p-4 space-y-2"
          >
            {columnas.map((col) => (
              <div key={col.cabecera} className="flex justify-between items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 shrink-0">
                  {col.cabecera}
                </span>
                <span className="font-semibold text-sm text-zinc-950 dark:text-white text-right">
                  {col.render(fila)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
