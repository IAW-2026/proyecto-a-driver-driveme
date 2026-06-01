"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BugPlay } from "lucide-react";

export default function SimularWebhookBoton({ idConductor }: { idConductor: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Solo renderizar en desarrollo
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const simular = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mocks/feedback/api/simular-webhook?id=${idConductor}`);
      if (res.ok) {
        // Refrescar la página para ver el nuevo comentario
        router.refresh();
      } else {
        alert("Error al simular webhook");
      }
    } catch (e) {
      alert("Error de red al simular webhook");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 rounded-2xl border-4 border-dashed border-purple-500 bg-purple-50 dark:bg-purple-900/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-purple-700 dark:text-purple-400 uppercase tracking-widest flex items-center gap-2">
            <BugPlay className="w-4 h-4" /> Entorno de Pruebas
          </p>
          <p className="text-xs font-medium text-purple-600 dark:text-purple-300 mt-1">
            Simula que la Feedback App envió una calificación.
          </p>
        </div>
        <button
          onClick={simular}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white font-bold rounded-xl shadow-[4px_4px_0px_0px_#4c1d95] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#4c1d95] active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 text-sm"
        >
          {loading ? "Simulando..." : "Simular Webhook"}
        </button>
      </div>
    </div>
  );
}
