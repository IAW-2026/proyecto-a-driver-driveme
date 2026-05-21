// app/hooks/useRadarViajes.ts
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SolicitudViaje } from "@/app/types/viajes";

interface Props {
  isOnline: boolean;
  conductorId: string;
  vehiculoId?: string;
  latitud: number;
  longitud: number;
  mostrarToast: (mensaje: string, tipo: "ok" | "error") => void;
}

const TIMER_DURACION = 30;

export function useRadarViajes({ isOnline, conductorId, vehiculoId, latitud, longitud, mostrarToast }: Props) {
  const router = useRouter();

  const [solicitudActual, setSolicitudActual] = useState<SolicitudViaje | null>(null);
  const [colaSolicitudes, setColaSolicitudes] = useState<SolicitudViaje[]>([]);
  const [timerSegundos, setTimerSegundos] = useState(TIMER_DURACION);
  const [aceptando, setAceptando] = useState(false);

  useEffect(() => {
    if (!isOnline || solicitudActual || colaSolicitudes.length > 0) return;

    const intervalo = setInterval(async () => {
      try {
        const res = await fetch("/api/solicitudes?estado=BUSCANDO_CONDUCTOR");
        const data = await res.json();

        if (data && Array.isArray(data.solicitudes) && data.solicitudes.length > 0) {
          setColaSolicitudes(data.solicitudes);
        }
      } catch (error) {
        console.error("Error en el radar:", error);
      }
    }, 5000);

    return () => clearInterval(intervalo);
  }, [isOnline, solicitudActual, colaSolicitudes.length]);

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

  // ── ACCIONES ──
  const handleAceptar = async () => {
    if (!solicitudActual || aceptando) return;
    setAceptando(true);

    if (!vehiculoId) {
      mostrarToast("No tenés vehículo registrado.", "error");
      setAceptando(false);
      return;
    }

    try {
      const res = await fetch("/api/viajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_solicitud: solicitudActual.id_solicitud,
          id_conductor: conductorId,
          id_pasajero: solicitudActual.pasajero.id_pasajero,
          id_vehiculo: vehiculoId,
          latitud_actual: latitud,
          longitud_actual: longitud,
          metodo_pago: "EFECTIVO",
          precio_estimado: solicitudActual.precio_estimado,
          origen_latitud: solicitudActual.origen.latitud,
          origen_longitud: solicitudActual.origen.longitud,
          origen_direccion: solicitudActual.origen.direccion,
          destino_latitud: solicitudActual.destino.latitud,
          destino_longitud: solicitudActual.destino.longitud,
          destino_direccion: solicitudActual.destino.direccion,
          pasajero_nombre: solicitudActual.pasajero.nombre
        }),
      });

      const data = await res.json();
      if (res.status === 409) {
        mostrarToast("Ese viaje ya fue tomado por otro conductor.", "error");
        setSolicitudActual(null);
        return;
      }
      if (!res.ok) throw new Error();

      limpiarSolicitud();
      router.push(`/viaje/${data.data.id_viaje}`);
    } catch {
      mostrarToast("Sin conexión o error al aceptar.", "error");
    } finally {
      setAceptando(false);
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
    limpiarSolicitud
  };
}