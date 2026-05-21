// app/components/Toast.tsx
"use client";

import { useEffect } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface ToastProps {
  mensaje: string;
  tipo: "ok" | "error";
  onClose: () => void;
}

export default function Toast({ mensaje, tipo, onClose }: ToastProps) {
  // Auto-cierre del toast a los 3 segundos
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      role="status"
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-[4px_4px_0px_0px_#09090b] border-2 border-zinc-950 font-bold text-sm animate-in fade-in slide-in-from-top-4 ${tipo === "ok" ? "bg-brand text-zinc-950" : "bg-alert text-white"
        }`}
    >
      {tipo === "ok" ? (
        <CheckCircle2 className="w-5 h-5" />
      ) : (
        <AlertCircle className="w-5 h-5" />
      )}
      {mensaje}
    </div>
  );
}