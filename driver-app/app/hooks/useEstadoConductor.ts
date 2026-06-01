// useEstadoConductor.ts
import { useState, useTransition, useOptimistic } from "react";
import { toggleConductorStatus } from "@/app/actions/conductor/toggleConductorStatus";

interface Props {
  conductorId: string;
  estadoInicial: boolean;
  mostrarToast: (mensaje: string, tipo: "ok" | "error") => void;
  onApagar: () => void;
}

export function useEstadoConductor({ conductorId, estadoInicial, mostrarToast, onApagar }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isOnlineReal, setIsOnlineReal] = useState(estadoInicial);

  // useOptimistic maneja el rollback automáticamente al terminar la transition
  const [isOnline, setIsOnlineOptimistic] = useOptimistic(isOnlineReal);

  const toggleEstado = (vehiculoId?: string) => {
    const nuevoEstado = !isOnline;

    if (!nuevoEstado) onApagar();

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(nuevoEstado ? [30, 20, 30] : [60]);
    }

    startTransition(async () => {
      setIsOnlineOptimistic(nuevoEstado); // ✅ se revierte solo si la transition falla

      const result = await toggleConductorStatus(conductorId, nuevoEstado, vehiculoId);

      if (!result.success) {
        mostrarToast("Error al cambiar estado. Intentá de nuevo.", "error");
      } else {
        setIsOnlineReal(nuevoEstado); // confirmar el estado real
        mostrarToast(nuevoEstado ? "¡Estás online! Buscando viajes..." : "Modo offline activado.", "ok");
      }
    });
  };

  return { isOnline, isPending, toggleEstado };
}