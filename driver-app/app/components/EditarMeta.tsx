"use client";

import { useState, useTransition } from "react";
import { actualizarMetaDiaria } from "@/app/actions/conductor";
import { Target, Check } from "lucide-react";

interface EditarMetaProps {
  conductorId: string;
  metaActual: number;
}

export default function EditarMeta({ conductorId, metaActual }: EditarMetaProps) {
  const [meta, setMeta] = useState(metaActual);
  const [isPending, startTransition] = useTransition();
  const [guardado, setGuardado] = useState(false);

  const handleGuardar = () => {
    if (meta === metaActual) return;

    startTransition(async () => {
      const result = await actualizarMetaDiaria(conductorId, meta);
      if (result.success) {
        setGuardado(true);
        setTimeout(() => setGuardado(false), 2000); // El tilde verde desaparece a los 2s
      } else {
        alert(result.error);
      }
    });
  };

  return (
    <div className="rounded-2xl border-2 border-zinc-950 bg-white dark:border-zinc-700 dark:bg-zinc-900 shadow-[4px_4px_0px_0px_#09090b] dark:shadow-none overflow-hidden">
      <div className="px-5 py-4 border-b-2 border-zinc-950 dark:border-zinc-700 flex items-center gap-2 bg-zinc-100 dark:bg-zinc-950">
        <Target className="w-5 h-5 text-zinc-950 dark:text-brand" strokeWidth={3} />
        <h2 className="text-sm font-extrabold text-zinc-950 dark:text-white uppercase tracking-wider">
          Configurar Meta Diaria
        </h2>
      </div>

      <div className="p-5 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label htmlFor="meta" className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-2">
            ¿Cuánto querés ganar por día?
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-lg text-zinc-400">
              $
            </span>
            <input
              id="meta"
              type="number"
              step="1000"
              value={meta}
              onChange={(e) => setMeta(Number(e.target.value))}
              className="w-full pl-8 pr-4 py-3 rounded-xl border-2 border-zinc-950 bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-600 dark:text-white font-extrabold text-lg focus:outline-none focus:ring-4 focus:ring-brand/30 transition-all"
            />
          </div>
        </div>

        <button
          onClick={handleGuardar}
          disabled={isPending || meta === metaActual}
          className="w-full md:w-auto px-6 py-3 min-h-[52px] rounded-xl border-2 border-zinc-950 bg-brand text-zinc-950 font-extrabold uppercase shadow-[4px_4px_0px_0px_#09090b] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#09090b] dark:border-brand dark:shadow-[4px_4px_0px_0px_#CFFF04] dark:hover:-translate-y-1 dark:hover:shadow-[6px_6px_0px_0px_#CFFF04] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
        >
          {isPending ? (
            <span className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
          ) : guardado ? (
            <><Check className="w-5 h-5" strokeWidth={3} /> Guardado</>
          ) : (
            "Guardar Meta"
          )}
        </button>
      </div>
    </div>
  );
}