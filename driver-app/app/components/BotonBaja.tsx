"use client";

import { useTransition } from "react";
import { bajaConductor } from "@/app/actions/conductor/bajaConductor";

export default function BotonBaja() {
  const [isPending, startTransition] = useTransition();

  function handleBaja() {
    if (confirm("¿Estás seguro de que quieres dar de baja tu cuenta? Podrás reactivarla más adelante ingresando con tus mismos datos de registro.")) {
      startTransition(() => {
        bajaConductor();
      });
    }
  }

  return (
    <div className="pt-8 mt-8 border-t-2 border-zinc-950 dark:border-zinc-800">
      <div className="inline-block px-3 py-1 bg-alert border-2 border-zinc-950 rounded-lg shadow-[2px_2px_0px_0px_#09090b] mb-4">
        <h3 className="text-sm font-black text-zinc-950 uppercase tracking-widest">Zona de Peligro</h3>
      </div>
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-4">
        Al dar de baja tu cuenta, tu perfil dejará de ser visible, tus vehículos y datos quedarán inactivos, y cerrarás sesión automáticamente.
      </p>
      <button
        onClick={handleBaja}
        disabled={isPending}
        className="w-full md:w-auto px-6 py-3 rounded-xl border-2 border-zinc-950 bg-alert text-zinc-950 dark:text-zinc-950 font-extrabold text-base shadow-[4px_4px_0px_0px_#09090b] transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-alert/30 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Procesando baja..." : "Dar de baja mi cuenta"}
      </button>
    </div>
  );
}
