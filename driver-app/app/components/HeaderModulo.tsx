// app/components/HeaderModulo.tsx
import React from "react";

interface HeaderModuloProps {
  titulo: string;
  icono?: React.ElementType;
  subtitulo?: React.ReactNode;
  acciones?: React.ReactNode;
}

export default function HeaderModulo({
  titulo,
  icono: Icon,
  subtitulo,
  acciones
}: HeaderModuloProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(220,38,38,0.25)] pb-4 mb-6">
      <div className="flex items-center gap-4 min-w-0 w-full sm:flex-1">
        {Icon && (
          <div className="bg-[rgba(20,20,20,0.8)] border border-[rgba(220,38,38,0.3)] shadow-[0_0_15px_rgba(220,38,38,0.2)] p-2.5 rounded-full shrink-0 flex items-center justify-center backdrop-blur-sm">
            <Icon className="w-5 h-5 text-primary drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]" strokeWidth={2} />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-sci uppercase tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] truncate">
            {titulo}
          </h1>
          {subtitulo && (
            <div className="mt-1 font-sans font-bold text-[#9CA3AF] uppercase text-[10px] md:text-xs tracking-[0.2em] truncate">
              {subtitulo}
            </div>
          )}
        </div>
      </div>
      {acciones && (
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {acciones}
        </div>
      )}
    </div>
  );
}