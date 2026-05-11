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
      className="flex justify-between items-center rounded-xl p-3 md:p-5 border transition-colors duration-300"
      style={{ backgroundColor: "var(--surface-muted)", borderColor: "var(--border)" }}
    >
      <span className="font-bold text-sm md:text-base pl-2" style={{ color: "var(--foreground)" }}>
        {isOnline ? "ESTÁS CONECTADO" : "CONECTARSE"}
      </span>

      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`w-14 h-7 rounded-full relative transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-teal-400 ${isOnline ? "cursor-pointer" : "cursor-pointer"
          }`}
        style={
          isOnline
            ? { backgroundColor: "var(--accent)" } // Verde/Color principal si está ON
            : { backgroundColor: "var(--muted)" }  // Gris si está OFF
        }
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