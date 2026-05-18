"use client";

/**
 * app/components/MapaViaje.tsx
 * -----------------------------------------------------------------------
 * Mapa Leaflet para la pantalla de Viaje en Curso con estética Neobrutalista.
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

// ── Generador de Íconos Neobrutalistas con Lucide y Tailwind ────────────

const createNeobrutalistIcon = (bgClass: string, IconComponent: React.ElementType) => {
  // Al no pasarle la prop 'color', Lucide utiliza 'currentColor' por defecto.
  const iconHtml = renderToString(<IconComponent size={20} strokeWidth={2.5} />);

  return L.divIcon({
    className: "bg-transparent",
    html: `
      <div class="${bgClass} w-[36px] h-[36px] border-[3px] border-[#09090B] shadow-[4px_4px_0px_0px_#09090B] flex items-center justify-center rounded-md text-[#09090B]">
        ${iconHtml}
      </div>
    `,
    iconAnchor: [18, 36], // Anclado en la base central del cuadrado
    popupAnchor: [0, -36], // El popup aparece arriba del ícono
  });
};

const iconOrigen = createNeobrutalistIcon("bg-brand", UserRound);
const iconDestino = createNeobrutalistIcon("bg-alert", MapPin);
const iconConductor = createNeobrutalistIcon("bg-white", Navigation);

// ── Componentes y Helpers Auxiliares ────────────────────────────────────

function SeguirConductor({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

// Lógica extraída para cumplir con DRY
async function fetchRoute(start: [number, number], end: [number, number]): Promise<[number, number][] | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data: OSRMResponse = await res.json();

    if (data.routes && data.routes[0]) {
      // Convertir de [lng, lat] a [lat, lng]
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
    if (L.Icon && L.Icon.Default && L.Icon.Default.prototype) {
      const defaultIconPrototype = L.Icon.Default.prototype as { _getIconUrl?: string };
      delete defaultIconPrototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
    }
  }, []);

  // Fetch de rutas consolidado
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
          color="#09090B"
          weight={6}
          dashArray="12 12"
          lineCap="square"
        />
      )}

      {estado === "EN_CURSO" && rutaViaje.length > 0 && (
        <Polyline
          positions={rutaViaje}
          color="#09090B"
          weight={6}
          lineCap="square"
        />
      )}

      <Marker position={[conductorLat, conductorLng]} icon={iconConductor}>
        <Popup>Tu posición actual</Popup>
      </Marker>

      <Marker position={[origenLat, origenLng]} icon={iconOrigen}>
        <Popup>Punto de recogida</Popup>
      </Marker>

      <Marker position={[destinoLat, destinoLng]} icon={iconDestino}>
        <Popup>Destino del pasajero</Popup>
      </Marker>

      <SeguirConductor lat={conductorLat} lng={conductorLng} />
    </MapContainer>
  );
}