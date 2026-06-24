// app/hooks/useRadarViajes.ts
import { useState, useEffect, useRef } from "react";
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

  // Refs para leer el estado dentro del setInterval sin re-ejecutar el useEffect
  const solicitudActualRef = useRef(solicitudActual);
  const colaRef = useRef(colaSolicitudes);

  useEffect(() => {
    solicitudActualRef.current = solicitudActual;
    colaRef.current = colaSolicitudes;
  }, [solicitudActual, colaSolicitudes]);

  // ── Radar: polling cada 5s ────────────────────────────────────────────────
  useEffect(() => {
    if (!isOnline) return;

    const intervalo = setInterval(async () => {
      const result = await buscarSolicitudes();

      if (!result.success) {
        console.warn("[Radar] Rider App no disponible, reintentando...");
        return;
      }

      const activas = result.solicitudes;

      // 1. Verificar si la solicitud actual sigue siendo válida
      if (solicitudActualRef.current) {
        const sigueActiva = activas.some(
          (a) => a.id_solicitud === solicitudActualRef.current!.id_solicitud
        );
        if (!sigueActiva) {
          setSolicitudActual(null);
          mostrarToast("La solicitud expiró o fue tomada.", "error");
        }
      }

      // 2. Actualizar la cola de solicitudes
      setColaSolicitudes((colaActual) => {
        const idsActivos = new Set(activas.map((a) => a.id_solicitud));

        // Filtrar las que ya no están activas de la cola
        const nuevaCola = colaActual.filter((c) => idsActivos.has(c.id_solicitud));

        // Añadir las nuevas (que no están ni en la cola ni es la actual)
        const idsEnCola = new Set(nuevaCola.map((c) => c.id_solicitud));
        const idActual = solicitudActualRef.current?.id_solicitud;

        const nuevas = activas.filter(
          (a) => !idsEnCola.has(a.id_solicitud) && a.id_solicitud !== idActual
        );

        return [...nuevaCola, ...nuevas];
      });
    }, 5000);

    return () => clearInterval(intervalo);
  }, [isOnline, mostrarToast]);

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
      id_pasajero:       (solicitudActual as any).id_pasajero || solicitudActual.pasajero?.id_pasajero || "sin-id",
      id_vehiculo:       vehiculoId,
      latitud_actual:    latitud,
      longitud_actual:   longitud,
      metodo_pago:       "EFECTIVO",
      precio_estimado:   solicitudActual.precio_estimado,
      origen_latitud:    solicitudActual.origen?.latitud,
      origen_longitud:   solicitudActual.origen?.longitud,
      origen_direccion:  solicitudActual.origen?.direccion,
      destino_latitud:   solicitudActual.destino?.latitud,
      destino_longitud:  solicitudActual.destino?.longitud,
      destino_direccion: solicitudActual.destino?.direccion,
      pasajero_nombre:   (solicitudActual as any).pasajero_nombre || solicitudActual.pasajero?.nombre || "Pasajero Desconocido",
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
        mostrarToast("Error: " + (result as any).detalle, "error");
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


  return {
    solicitudActual,
    timerSegundos,
    aceptando,
    handleAceptar,
    handleRechazar,
    limpiarSolicitud,
  };
}