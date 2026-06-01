// app/components/HeaderModulo.tsx
import React from "react";

interface HeaderModuloProps {
  titulo: string;
  icono: React.ElementType;
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
    <div className="flex flex-row items-center justify-between gap-4 border-b-4 border-zinc-950 dark:border-zinc-800 pb-4">
      <div className="flex items-center gap-3 min-w-0 w-full sm:flex-1">
        <div className="bg-brand border-2 border-zinc-950 shadow-[3px_3px_0px_0px_#09090b] dark:shadow-[3px_3px_0px_0px_#CFFF04] p-2 rounded-xl shrink-0">
          <Icon className="w-6 h-6 text-zinc-950" strokeWidth={3} />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl md:text-4xl font-extrabold uppercase tracking-tight text-zinc-950 dark:text-white truncate">
            {titulo}
          </h1>
          {subtitulo && (
            <div className="mt-1 font-bold text-zinc-600 dark:text-zinc-400 uppercase text-[10px] md:text-xs tracking-widest truncate">
              {subtitulo}
            </div>
          )}
        </div>
      </div>
      {acciones && (
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {acciones}
        </div>
      )}
    </div>
  );
}