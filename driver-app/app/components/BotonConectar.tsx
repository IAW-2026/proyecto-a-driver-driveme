"use client";

import { useState, useTransition } from "react";
import { toggleConductorStatus } from "@/app/actions/conductor/toggleConductorStatus";

interface ConnectButtonProps {
  conductorId: string;
  estadoInicial: boolean;
}

export default function ConnectButton({ conductorId, estadoInicial }: ConnectButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isOnline, setIsOnline] = useState(estadoInicial || false);

  const handleToggle = () => {
    const newState = !isOnline;
    setIsOnline(newState);

    startTransition(async () => {
      const result = await toggleConductorStatus(conductorId, newState);
      if (!result.success) {
        setIsOnline(!newState);
        alert("Error de conexión. Intentá de nuevo.");
      }
    });
  };

  return (
    <div
      className={`w-full md:w-auto flex justify-between items-center rounded-card p-4 border transition-all duration-150 ${
        isOnline
          ? 'border-primary bg-[rgba(220,38,38,0.1)] shadow-[0_0_20px_rgba(220,38,38,0.15)]'
          : 'border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)]'
      }`}
    >
      <span className="font-extrabold text-sm md:text-base text-white">
        {isOnline ? "ESTÁS CONECTADO" : "CONECTARSE"}
      </span>

      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`relative flex items-center w-14 h-7 rounded-full border p-0.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary ${
          isOnline
            ? 'bg-primary border-primary-dark'
            : 'bg-[#1F1F1F] border-[rgba(255,255,255,0.1)]'
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full shadow transition-transform duration-300 ${
            isOnline
              ? 'translate-x-7 bg-white'
              : 'translate-x-0.5 bg-[#6B7280]'
          }`}
        />
      </button>
    </div>
  );
}