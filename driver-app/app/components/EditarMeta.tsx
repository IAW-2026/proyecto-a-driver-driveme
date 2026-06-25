"use client";

import { useState, useTransition } from "react";
import { actualizarMetaDiaria } from "@/app/actions/conductor/actualizarMetaDiaria";
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
        setTimeout(() => setGuardado(false), 2000);
      } else {
        alert(result.error);
      }
    });
  };

  return (
    <div className="rounded-modal border border-[rgba(220,38,38,0.25)] bg-[rgba(10,10,10,0.7)] backdrop-blur-md shadow-[0_0_30px_rgba(220,38,38,0.1)] overflow-hidden">
      <div className="px-6 py-5 border-b border-[rgba(220,38,38,0.25)] flex items-center gap-3 bg-[rgba(10,10,10,0.5)]">
        <div className="bg-[rgba(220,38,38,0.1)] p-2 rounded-full border border-[rgba(220,38,38,0.3)]">
          <Target className="w-5 h-5 text-primary drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]" strokeWidth={2} />
        </div>
        <h2 className="text-base font-sci text-white uppercase tracking-[0.2em]">
          Configurar Meta Diaria
        </h2>
      </div>

      <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-end">
        <div className="flex-1 w-full">
          <label htmlFor="meta" className="block text-[10px] font-sci text-[#9CA3AF] uppercase tracking-[0.2em] mb-3">
            ¿Cuánto querés ganar por día?
          </label>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 font-sci text-lg text-[#6B7280]">
              $
            </span>
            <input
              id="meta"
              type="number"
              step="1000"
              value={meta}
              onChange={(e) => setMeta(Number(e.target.value))}
              className="w-full pl-10 pr-5 py-4 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] text-white font-sci text-lg focus:outline-none focus:border-[rgba(220,38,38,0.5)] focus:bg-[rgba(220,38,38,0.05)] focus:shadow-[0_0_15px_rgba(220,38,38,0.2)] transition-all"
            />
          </div>
        </div>

        <button
          onClick={handleGuardar}
          disabled={isPending || meta === metaActual}
          className="w-full md:w-auto px-8 py-4 min-h-[60px] rounded-full border border-[rgba(220,38,38,0.4)] bg-[rgba(220,38,38,0.1)] text-primary font-sci text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(220,38,38,0.2)] hover:bg-[rgba(220,38,38,0.2)] hover:translate-y-[-1px] hover:shadow-[0_0_25px_rgba(220,38,38,0.3)] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 backdrop-blur-sm active:scale-[0.98]"
        >
          {isPending ? (
            <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : guardado ? (
            <><Check className="w-5 h-5" strokeWidth={2} /> Guardado</>
          ) : (
            "Guardar Meta"
          )}
        </button>
      </div>
    </div>
  );
}