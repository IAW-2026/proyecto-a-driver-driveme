// app/hooks/useRadarViajes.ts
import { useState, useEffect } from "react";
import { SolicitudViaje } from "@/app/types/viajes";
import { aceptarViaje } from "@/app/actions/conductor/aceptarViaje";
import { buscarSolicitudes } from "@/app/actions/conductor/buscarSolicitudes";

interface Props {
  isOnline: boolean;
  conductorId: string;
  vehiculoId?: string;
  latitud: number;
  longitud: number;
  mostrarToast: (mensaje: string, tipo: "ok" | "error") => void;
}

const TIMER_DURACION = 30;

export function useRadarViajes({
  isOnline,
  conductorId,
  vehiculoId,
  latitud,
  longitud,
  mostrarToast,
}: Props) {
  const [solicitudActual, setSolicitudActual] = useState<SolicitudViaje | null>(null);
  const [colaSolicitudes, setColaSolicitudes] = useState<SolicitudViaje[]>([]);
  const [timerSegundos, setTimerSegundos]     = useState(TIMER_DURACION);
  const [aceptando, setAceptando]             = useState(false);

  // ── Radar: polling cada 5s ────────────────────────────────────────────────
  useEffect(() => {
    if (!isOnline || solicitudActual || colaSolicitudes.length > 0) return;

    const intervalo = setInterval(async () => {
      const result = await buscarSolicitudes();

      if (!result.success) {
        console.warn("[Radar] Rider App no disponible, reintentando...");
        return;
      }

      if (result.solicitudes.length > 0) {
        setColaSolicitudes(result.solicitudes);
      }
    }, 5000);

    return () => clearInterval(intervalo);
  }, [isOnline, solicitudActual, colaSolicitudes.length]);

  // ── Desencolar siguiente solicitud ────────────────────────────────────────
  useEffect(() => {
    if (isOnline && !solicitudActual && colaSolicitudes.length > 0) {
      const [siguiente, ...restoDeLaCola] = colaSolicitudes;

      setSolicitudActual(siguiente);
      setColaSolicitudes(restoDeLaCola);
      setTimerSegundos(TIMER_DURACION);

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 200]);
      }
    }
  }, [isOnline, solicitudActual, colaSolicitudes]);

  // ── Timer de decisión ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!solicitudActual) return;

    if (timerSegundos <= 0) {
      setSolicitudActual(null);
      mostrarToast("Tiempo agotado. Solicitud descartada.", "error");
      return;
    }

    const tick = setTimeout(() => setTimerSegundos((t) => t - 1), 1000);
    return () => clearTimeout(tick);
  }, [solicitudActual, timerSegundos, mostrarToast]);

  // ── ACCIONES ──────────────────────────────────────────────────────────────

  const handleAceptar = async () => {
    if (!solicitudActual || aceptando) return;

    if (!vehiculoId) {
      mostrarToast("No tenés vehículo registrado.", "error");
      return;
    }

    setAceptando(true);

    const result = await aceptarViaje({
      id_solicitud:      solicitudActual.id_solicitud,
      id_conductor:      conductorId,
      id_pasajero:       solicitudActual.pasajero.id_pasajero,
      id_vehiculo:       vehiculoId,
      latitud_actual:    latitud,
      longitud_actual:   longitud,
      metodo_pago:       "EFECTIVO",
      precio_estimado:   solicitudActual.precio_estimado,
      origen_latitud:    solicitudActual.origen.latitud,
      origen_longitud:   solicitudActual.origen.longitud,
      origen_direccion:  solicitudActual.origen.direccion,
      destino_latitud:   solicitudActual.destino.latitud,
      destino_longitud:  solicitudActual.destino.longitud,
      destino_direccion: solicitudActual.destino.direccion,
      pasajero_nombre:   solicitudActual.pasajero.nombre,
    });

    setAceptando(false);

    switch (result.error) {
      case "CONFLICTO":
        mostrarToast("Ese viaje ya fue tomado por otro conductor.", "error");
        setSolicitudActual(null);
        break;

      case "RIDER_APP_DOWN":
        // El viaje se guardó localmente; la sincronización M2M falló pero
        // no es bloqueante. El servidor igual ejecuta el redirect.
        mostrarToast("Viaje aceptado. La sincronización tardará unos segundos.", "ok");
        limpiarSolicitud();
        break;

      case "UNAUTHORIZED":
      case "FORBIDDEN_CONDUCTOR":
      case "CONDUCTOR_INACTIVO":
        mostrarToast("No tenés permisos para aceptar este viaje.", "error");
        break;

      case "VALIDACION":
        mostrarToast("Error en los datos del viaje. Intentá de nuevo.", "error");
        break;

      default:
        mostrarToast("Sin conexión o error al aceptar.", "error");
    }
  };

  const handleRechazar = () => {
    setSolicitudActual(null);
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(40);
  };

  const limpiarSolicitud = () => {
    setSolicitudActual(null);
    setColaSolicitudes([]);
    setTimerSegundos(TIMER_DURACION);
  };

  const simularViaje = () => {
    setColaSolicitudes((prev) => [
      ...prev,
      {
        id_solicitud: "mock-solicitud-" + Math.random().toString(36).substring(7),
        precio_estimado: Math.floor(Math.random() * 5000) + 1500,
        distancia_metros: Math.floor(Math.random() * 3000) + 500,
        origen: {
          latitud: latitud + 0.01,
          longitud: longitud + 0.01,
          direccion: "Av. Alem 1253, Bahía Blanca",
        },
        destino: {
          latitud: latitud - 0.01,
          longitud: longitud - 0.01,
          direccion: "Plaza Rivadavia, Centro",
        },
        pasajero: {
          id_pasajero: "pasajero-mock-abc",
          nombre: "Juan Pérez (Simulación)",
          calificacion: 4.8,
        },
        estado: "PENDIENTE",
        fecha_creacion: new Date().toISOString(),
      }
    ]);
  };

  return {
    solicitudActual,
    timerSegundos,
    aceptando,
    handleAceptar,
    handleRechazar,
    limpiarSolicitud,
    simularViaje,
  };
}