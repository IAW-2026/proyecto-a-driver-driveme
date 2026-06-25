// app/hooks/useToast.ts
import { useState, useCallback } from "react";

export function useToast() {
  const [toast, setToast] = useState<{ mensaje: string; tipo: "ok" | "error" } | null>(null);

  const mostrarToast = useCallback((mensaje: string, tipo: "ok" | "error" = "ok") => {
    setToast({ mensaje, tipo });
  }, []);

  const ocultarToast = useCallback(() => {
    setToast(null);
  }, []);

  return { toast, mostrarToast, ocultarToast };
}