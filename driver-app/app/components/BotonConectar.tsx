"use client";

import { useState, useTransition } from "react";
import { toggleConductorStatus } from "@/app/actions/conductor";

interface ConnectButtonProps {
  conductorId: string;
  estadoInicial: boolean;
}

export default function ConnectButton({ conductorId, estadoInicial }: ConnectButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isOnline, setIsOnline] = useState(estadoInicial || false);

  const handleToggle = () => {
    // 1. Invertimos el estado (Si estaba OFF, pasa a ON)
    const newState = !isOnline;

    // 2. Actualizamos la pantalla al instante (Optimistic UI)
    setIsOnline(newState);

    // 3. Ejecutamos la acción en la base de datos de fondo
    startTransition(async () => {
      const result = await toggleConductorStatus(conductorId, newState);

      // Si la base de datos falla (ej: se cortó el WiFi), revertimos el botón
      if (!result.success) {
        setIsOnline(!newState);
        alert("Error de conexión. Intentá de nuevo.");
      }
    });
  };

  return (
    <div
      className="w-full md:w-auto flex justify-between items-center rounded-3xl p-4 border-2 border-zinc-950 bg-[rgba(207,255,4,0.08)] shadow-[4px_4px_0px_0px_#09090b] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#09090b] dark:border-2 dark:border-brand dark:bg-zinc-950 dark:shadow-[4px_4px_0px_0px_#CFFF04] dark:hover:-translate-y-1 dark:hover:shadow-[6px_6px_0px_0px_#CFFF04]"
    >
      <span className="font-extrabold text-sm md:text-base text-[var(--foreground)]">
        {isOnline ? "ESTÁS CONECTADO" : "CONECTARSE"}
      </span>

      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`relative flex items-center justify-between w-full md:w-auto min-h-[56px] rounded-full border-2 px-4 py-3 transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-brand/30 shadow-[4px_4px_0px_0px_#09090b] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#09090b] dark:border-2 dark:border-brand dark:shadow-[4px_4px_0px_0px_#CFFF04] dark:hover:-translate-y-1 dark:hover:shadow-[6px_6px_0px_0px_#CFFF04] ${isOnline ? "bg-brand text-zinc-950" : "bg-[rgba(207,255,4,0.08)] text-[var(--foreground)] dark:bg-zinc-950"}`}
      >
        <div
          className={`absolute top-1 w-5 h-5 rounded-full shadow transition-transform duration-300 ${isOnline ? "translate-x-8" : "translate-x-1"
            }`}
          style={{ backgroundColor: "var(--surface)" }}
        ></div>

        <span
          className={`absolute text-[10px] font-bold top-1.5 transition-all duration-300 ${isOnline ? "left-2" : "right-2"
            }`}
          style={
            isOnline
              ? { color: "var(--text-inverted)" }
              : { color: "var(--surface)" }
          }
        >
          {isOnline ? "ON" : "OFF"}
        </span>
      </button>
    </div>
  );
}