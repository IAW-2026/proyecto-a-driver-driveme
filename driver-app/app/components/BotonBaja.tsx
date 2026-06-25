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
    <div className="pt-8 mt-8 border-t border-[rgba(239,68,68,0.2)]">
      <div className="inline-block px-3 py-1 bg-[rgba(239,68,68,0.15)] border border-[#EF4444]/50 shadow-[0_0_10px_rgba(239,68,68,0.1)] rounded-sharp mb-4">
        <h3 className="text-sm font-black text-[#F87171] uppercase tracking-[0.2em]">Zona de Peligro</h3>
      </div>
      <p className="text-sm font-medium text-[#9CA3AF] mb-4">
        Al dar de baja tu cuenta, tu perfil dejará de ser visible, tus vehículos y datos quedarán inactivos, y cerrarás sesión automáticamente.
      </p>
      <button
        onClick={handleBaja}
        disabled={isPending}
        className="w-full md:w-auto px-6 py-3 rounded-sharp border border-[#991B1B] bg-gradient-to-b from-[#EF4444] to-[#DC2626] text-white font-extrabold text-sm uppercase tracking-wider shadow-[0_0_15px_rgba(239,68,68,0.15)] transition-all duration-150 hover:translate-y-[-1px] hover:shadow-[0_0_20px_rgba(239,68,68,0.25)] focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Procesando baja..." : "Dar de baja mi cuenta"}
      </button>
    </div>
  );
}
