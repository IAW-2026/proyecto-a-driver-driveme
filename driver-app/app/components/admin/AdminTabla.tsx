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
  /**
   * Custom renderer for each row in the mobile card view.
   * When provided, replaces the default label-value column pairs.
   */
  mobileRender?: (fila: T) => React.ReactNode;
}

/**
 * AdminTabla — Tabla Dark Sci-Fi, responsive y reutilizable.
 */
export default function AdminTabla<T>({
  columnas,
  filas,
  keyExtractor,
  mensajeVacio = "No hay datos para mostrar.",
  mobileRender,
}: AdminTablaProps<T>) {
  if (filas.length === 0) {
    return (
      <div className="py-16 text-center text-[#6B7280] font-bold uppercase tracking-[0.2em] text-xs">
        {mensajeVacio}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      {/* ── Desktop Table ─────────────────────────────────────── */}
      <table className="hidden md:table w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[rgba(220,38,38,0.15)] bg-[#0A0A0A]">
            {columnas.map((col) => (
              <th
                key={col.cabecera}
                className={`py-4 px-4 text-left font-extrabold uppercase tracking-widest text-[10px] text-[#9CA3AF] ${col.className ?? ""}`}
              >
                {col.cabecera}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
          {filas.map((fila) => (
            <tr
              key={keyExtractor(fila)}
              className="hover:bg-[#1F1F1F] transition-colors duration-150 group"
            >
              {columnas.map((col) => (
                <td
                  key={col.cabecera}
                  className={`py-4 px-4 font-medium text-white ${col.className ?? ""}`}
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
            className="rounded-card border border-[rgba(220,38,38,0.15)] bg-[rgba(20,20,20,0.8)] shadow-[0_0_20px_rgba(220,38,38,0.05)] p-4 space-y-3"
          >
            {mobileRender ? (
              mobileRender(fila)
            ) : (
              columnas.map((col) => (
                <div key={col.cabecera} className="flex items-start justify-between gap-3 flex-wrap border-b border-[rgba(255,255,255,0.03)] pb-2 last:border-0 last:pb-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#6B7280] shrink-0 pt-0.5">
                    {col.cabecera}
                  </span>
                  <span className="font-semibold text-sm text-white text-right min-w-0 break-words">
                    {col.render(fila)}
                  </span>
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
