"use client";

import { useState, useEffect, useTransition } from "react";
import { toggleConductorStatus, aceptarSolicitud } from "@/app/actions/conductor";
import { Prisma } from "@/app/generated/prisma/client";
import { SolicitudViaje } from "@/app/types/viajes";

// 1. Le decimos a Prisma que extraiga el tipo exacto incluyendo la relación de vehículos
type ConductorConVehiculos = Prisma.ConductorGetPayload<{
  include: { vehiculos: true };
}>;

// 2. Tipamos fuertemente las props
interface PanelConductorProps {
  conductorData: ConductorConVehiculos;
}

export default function PanelConductor({ conductorData }: PanelConductorProps) {
  const [isPending, startTransition] = useTransition();
  const [isOnline, setIsOnline] = useState(conductorData.disponible);
  const [solicitudActual, setSolicitudActual] = useState<SolicitudViaje | null>(null);

  // --- LÓGICA DEL BOTÓN ONLINE/OFFLINE ---
  const handleToggle = () => {
    const newState = !isOnline;
    setIsOnline(newState);
    if (!newState) setSolicitudActual(null);

    startTransition(async () => {
      try {
        console.log("Intentando cambiar estado a:", newState);
        const result = await toggleConductorStatus(conductorData.id_conductor, newState);

        if (!result.success) {
          // Si falla, ahora nos va a saltar una alerta en toda la cara
          alert("❌ El servidor rechazó el cambio. Revisá la terminal de VS Code.");
          setIsOnline(!newState); // Rollback
        } else {
          console.log("¡Cambio guardado en la BD!");
        }
      } catch (error) {
        alert("❌ Error crítico conectando con el servidor Action.");
        console.error(error);
        setIsOnline(!newState);
      }
    });
  };

  // --- LÓGICA DE POLLING (SIMULADOR REST) ---
  useEffect(() => {
    let intervalo: NodeJS.Timeout;

    // Solo buscamos solicitudes si está online y NO tiene ya una solicitud en pantalla
    if (isOnline && !solicitudActual) {
      intervalo = setInterval(async () => {
        try {
          const res = await fetch('/api/solicitudes/mock');
          const data = await res.json();
          if (data.solicitud) {
            setSolicitudActual(data.solicitud);
          }
        } catch (error) {
          console.error("Error consultando API REST:", error);
        }
      }, 5000); // Consulta la API cada 5 segundos
    }

    return () => clearInterval(intervalo);
  }, [isOnline, solicitudActual]);

  // --- LÓGICA DE ACEPTAR/RECHAZAR ---
  const handleAceptar = async () => {
    if (!solicitudActual) return;

    // Por simplicidad, usamos el primer vehículo registrado del conductor
    const vehiculoId = conductorData.vehiculos[0].id_vehiculo;

    await aceptarSolicitud(conductorData.id_conductor, vehiculoId, solicitudActual.precio_estimado);
    alert("¡Viaje aceptado! Pasando a modo Navegación...");
    setSolicitudActual(null); // Limpiamos la pantalla
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
      {/* Panel Izquierdo: Métricas y Botón */}
      <div className="flex-1 space-y-4 md:space-y-6">

        <div
          className="flex justify-between items-center rounded-xl p-3 md:p-5 border transition-colors duration-300"
          style={{ backgroundColor: "var(--surface-muted)", borderColor: "var(--border)" }}
        >
          <span className="font-bold text-sm md:text-base pl-2" style={{ color: "var(--foreground)" }}>
            {isOnline ? "ESTÁS CONECTADO" : "CONECTARSE"}
          </span>
          <button
            onClick={handleToggle} disabled={isPending}
            className="w-14 h-7 rounded-full relative transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-teal-400"
            style={isOnline ? { backgroundColor: "var(--accent)" } : { backgroundColor: "var(--muted)" }}
          >
            <div
              className={`absolute top-1 w-5 h-5 rounded-full shadow transition-transform duration-300 ${isOnline ? "translate-x-8" : "translate-x-1"}`}
              style={{ backgroundColor: "var(--surface)" }}
            ></div>
            <span
              className={`absolute text-[10px] font-bold top-1.5 transition-all duration-300 ${isOnline ? "left-2" : "right-2"}`}
              style={isOnline ? { color: "var(--text-inverted)" } : { color: "var(--surface)" }}
            >
              {isOnline ? "ON" : "OFF"}
            </span>
          </button>
        </div>

        {/* Panel de Métricas */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <div className="p-3 md:p-5 rounded-xl border flex flex-col justify-between h-24 md:h-32 shadow-sm transition-colors" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <span className="text-[10px] md:text-xs font-bold leading-tight" style={{ color: "var(--muted)" }}>HORAS ONLINE</span>
            <span className="text-xl md:text-3xl font-bold" style={{ color: "var(--foreground)" }}>---</span>
          </div>
          <div className="p-3 md:p-5 rounded-xl border flex flex-col justify-between h-24 md:h-32 shadow-sm transition-colors" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <span className="text-[10px] md:text-xs font-bold leading-tight" style={{ color: "var(--muted)" }}>GANANCIAS</span>
            <span className="text-xl md:text-3xl font-bold" style={{ color: "var(--foreground)" }}>---</span>
          </div>
          <div className="p-3 md:p-5 rounded-xl border flex flex-col justify-between h-24 md:h-32 shadow-sm transition-colors" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <span className="text-[10px] md:text-xs font-bold leading-tight" style={{ color: "var(--muted)" }}>VIAJES</span>
            <span className="text-xl md:text-3xl font-bold" style={{ color: "var(--foreground)" }}>---</span>
          </div>
        </div>
      </div>

      {/* Panel Derecho: Solicitud de Viaje Dinámica */}
      <div className="lg:w-1/3">
        <div className="rounded-xl border shadow-sm overflow-hidden h-full flex flex-col transition-colors duration-300" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>

          <div className="px-4 py-2 border-b transition-colors duration-300" style={{ backgroundColor: "var(--offer-bg)", borderColor: "var(--border)" }}>
            <h3 className="text-xs font-bold tracking-wider" style={{ color: "var(--offer-text)" }}>
              {isOnline ? (solicitudActual ? "NUEVA SOLICITUD DE VIAJE" : "BUSCANDO VIAJES...") : "MODO OFFLINE"}
            </h3>
          </div>

          {!isOnline ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center" style={{ color: "var(--muted)" }}>
              <span className="text-4xl mb-3 opacity-50">😴</span>
              <p className="text-sm font-medium">Conectate para empezar a recibir viajes de pasajeros.</p>
            </div>
          ) : !solicitudActual ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-pulse" style={{ color: "var(--muted)" }}>
              <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}></div>
              <p className="text-sm font-medium">Rastreando zona...</p>
            </div>
          ) : (
            <>
              {/* Solicitud Encontrada (Adaptada al nuevo JSON) */}
              <div className="p-4 flex gap-4 flex-1">
                <div className="w-16 h-16 border flex items-center justify-center shrink-0 rounded-lg transition-colors" style={{ backgroundColor: "var(--surface-muted)", borderColor: "var(--border)" }}>
                  <span className="text-2xl opacity-70">🗺️</span>
                </div>
                <div className="flex-1 text-sm font-medium space-y-1" style={{ color: "var(--muted)" }}>
                  <p className="font-bold text-base md:text-lg mb-2" style={{ color: "var(--foreground)" }}>
                    TARIFA EST.: ${solicitudActual.precio_estimado.toLocaleString('es-AR')}
                  </p>
                  <p className="text-xs font-bold" style={{ color: "var(--accent)" }}>👤 {solicitudActual.pasajero.nombre}</p>
                  <p>🟢 {solicitudActual.origen.direccion}</p>
                  <p>🔴 {solicitudActual.destino.direccion}</p>
                  <p className="text-xs mt-2 opacity-80">ETA: {solicitudActual.eta_min} MIN • {solicitudActual.distancia_km} KM</p>
                </div>
              </div>
              <div className="p-4 flex justify-between items-center gap-3">
                <button onClick={handleAceptar} className="flex-1 font-bold py-3 rounded-full hover:opacity-90 transition-opacity text-xs md:text-sm tracking-wide shadow-sm" style={{ backgroundColor: "var(--accent)", color: "var(--text-inverted)" }}>
                  ACEPTAR
                </button>
                <button onClick={() => setSolicitudActual(null)} className="px-6 py-3 border rounded-full font-bold hover:opacity-80 transition-opacity text-xs md:text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)", backgroundColor: "transparent" }}>
                  RECHAZAR
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}