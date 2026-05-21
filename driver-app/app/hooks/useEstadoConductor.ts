// app/hooks/useEstadoConductor.ts
import { useState, useTransition } from "react";
import { toggleConductorStatus } from "@/app/actions/conductor";

interface Props {
  conductorId: string;
  estadoInicial: boolean;
  mostrarToast: (mensaje: string, tipo: "ok" | "error") => void;
  onApagar: () => void;
}

export function useEstadoConductor({ conductorId, estadoInicial, mostrarToast, onApagar }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isOnline, setIsOnline] = useState(estadoInicial);

  const toggleEstado = () => {
    const nuevoEstado = !isOnline;
    setIsOnline(nuevoEstado);

    if (!nuevoEstado) {
      onApagar();
    }

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(nuevoEstado ? [30, 20, 30] : [60]);
    }

    startTransition(async () => {
      const result = await toggleConductorStatus(conductorId, nuevoEstado);
      if (!result.success) {
        setIsOnline(!nuevoEstado);
        mostrarToast("Error al cambiar estado. Intentá de nuevo.", "error");
      } else {
        mostrarToast(nuevoEstado ? "¡Estás online! Buscando viajes..." : "Modo offline activado.", "ok");
      }
    });
  };

  return { isOnline, isPending, toggleEstado };
}