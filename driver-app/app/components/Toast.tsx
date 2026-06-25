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
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-card border font-bold text-sm animate-in fade-in slide-in-from-top-4 ${tipo === "ok"
        ? "bg-[#059669] text-white border-[#059669]/50 shadow-[0_0_20px_rgba(5,150,105,0.2)]"
        : "bg-[#EF4444] text-white border-[#EF4444]/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
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