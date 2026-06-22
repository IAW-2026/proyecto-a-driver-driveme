"use client";

/**
 * app/components/MapaViaje.tsx
 * -----------------------------------------------------------------------
 * Mapa Leaflet para la pantalla de Viaje en Curso — Dark Sci-Fi aesthetic.
 * Importado dinámicamente (ssr: false) en su componente padre.
 * -----------------------------------------------------------------------
 */

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { renderToString } from "react-dom/server";
import { Navigation, MapPin, UserRound } from "lucide-react";

// ── Tipos ───────────────────────────────────────────────────────────────

interface OSRMResponse {
  routes?: {
    geometry: {
      coordinates: [number, number][]; // [lng, lat]
    };
  }[];
}

// ── Generador de Íconos Dark Sci-Fi con Lucide ─────────────────────────

const createSciFiIcon = (bgColor: string, borderColor: string, IconComponent: React.ElementType) => {
  const iconHtml = renderToString(<IconComponent size={18} strokeWidth={2.5} />);

  return L.divIcon({
    className: "bg-transparent",
    html: `
      <div style="background:${bgColor}; border: 2px solid ${borderColor}; box-shadow: 0 0 12px ${borderColor}40;" class="w-[34px] h-[34px] flex items-center justify-center rounded-[4px] text-white">
        ${iconHtml}
      </div>
    `,
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  });
};

const iconOrigen = createSciFiIcon("#DC2626", "#EF4444", UserRound);
const iconDestino = createSciFiIcon("#991B1B", "#DC2626", MapPin);
const iconConductor = createSciFiIcon("#141414", "#DC2626", Navigation);

// ── Componentes y Helpers Auxiliares ────────────────────────────────────

function SeguirConductor({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

async function fetchRoute(start: [number, number], end: [number, number]): Promise<[number, number][] | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data: OSRMResponse = await res.json();

    if (data.routes && data.routes[0]) {
      return data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]] as [number, number]);
    }
  } catch (error) {
    console.error("Error al obtener ruta OSRM:", error);
  }
  return null;
}

// ── Props y Componente Principal ────────────────────────────────────────

interface MapaViajeProps {
  origenLat: number;
  origenLng: number;
  destinoLat: number;
  destinoLng: number;
  conductorLat: number;
  conductorLng: number;
  estado: "ACEPTADO" | "EN_CURSO" | "FINALIZADO" | "CANCELADO_POR_CONDUCTOR";
}

export default function MapaViaje({
  origenLat,
  origenLng,
  destinoLat,
  destinoLng,
  conductorLat,
  conductorLng,
  estado,
}: MapaViajeProps) {
  const [rutaOrigen, setRutaOrigen] = useState<[number, number][]>([]);
  const [rutaViaje, setRutaViaje] = useState<[number, number][]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadRoutes = async () => {
      if (estado === "ACEPTADO") {
        if (rutaOrigen.length === 0) {
          setRutaOrigen([[conductorLat, conductorLng], [origenLat, origenLng]]);
        }
        const route = await fetchRoute([conductorLat, conductorLng], [origenLat, origenLng]);
        if (isMounted && route) setRutaOrigen(route);
      }

      if (estado === "EN_CURSO") {
        if (rutaViaje.length === 0) {
          setRutaViaje([[conductorLat, conductorLng], [destinoLat, destinoLng]]);
        }
        const route = await fetchRoute([conductorLat, conductorLng], [destinoLat, destinoLng]);
        if (isMounted && route) setRutaViaje(route);
      }
    };

    loadRoutes();

    return () => {
      isMounted = false;
    };
  }, [conductorLat, conductorLng, origenLat, origenLng, destinoLat, destinoLng, estado, rutaOrigen.length, rutaViaje.length]);

  return (
    <MapContainer
      center={[conductorLat, conductorLng]}
      zoom={15}
      className="w-full h-full z-0"
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {estado === "ACEPTADO" && rutaOrigen.length > 0 && (
        <Polyline
          positions={rutaOrigen}
          color="#DC2626"
          weight={5}
          dashArray="10 8"
          lineCap="square"
        />
      )}

      {estado === "EN_CURSO" && rutaViaje.length > 0 && (
        <Polyline
          positions={rutaViaje}
          color="#DC2626"
          weight={5}
          lineCap="square"
        />
      )}

      <Marker position={[conductorLat, conductorLng]} icon={iconConductor} alt="Posición actual del conductor" title="Posición actual del conductor">
        <Popup>Tu posición actual</Popup>
      </Marker>

      <Marker position={[origenLat, origenLng]} icon={iconOrigen} alt="Punto de recogida" title="Punto de recogida">
        <Popup>Punto de recogida</Popup>
      </Marker>

      <Marker position={[destinoLat, destinoLng]} icon={iconDestino} alt="Destino del pasajero" title="Destino del pasajero">
        <Popup>Destino del pasajero</Popup>
      </Marker>

      <SeguirConductor lat={conductorLat} lng={conductorLng} />
    </MapContainer>
  );
}