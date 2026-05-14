"use client";

/**
 * app/components/MapaViaje.tsx
 * -----------------------------------------------------------------------
 * Mapa Leaflet para la pantalla de Viaje en Curso.
 * Importado dinámicamente (ssr: false) porque Leaflet requiere el DOM.
 *
 * Props:
 *   origenLat/Lng  — punto de recogida del pasajero
 *   destinoLat/Lng — destino final
 *   conductorLat/Lng — posición actual del conductor (telemetría)
 * -----------------------------------------------------------------------
 */

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";

// Fix para íconos de Leaflet en Next.js (problema conocido con webpack)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Íconos personalizados
const iconOrigen = L.divIcon({
  className: "",
  html: `<div style="background:#22C55E;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
  iconAnchor: [9, 9],
});

const iconDestino = L.divIcon({
  className: "",
  html: `<div style="background:#EF4444;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
  iconAnchor: [9, 9],
});

const iconConductor = L.divIcon({
  className: "",
  html: `<div style="background:#4FD1C5;width:22px;height:22px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5);font-size:12px;display:flex;align-items:center;justify-content:center;">🚗</div>`,
  iconAnchor: [11, 11],
});

// Centra el mapa en la posición del conductor cuando cambia
function SeguirConductor({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

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
  origenLat, origenLng,
  destinoLat, destinoLng,
  conductorLat, conductorLng,
  estado,
}: MapaViajeProps) {
  const rutaOrigen: [number, number][] = [[conductorLat, conductorLng], [origenLat, origenLng]];
  const rutaViaje: [number, number][]  = [[origenLat, origenLng], [destinoLat, destinoLng]];

  return (
    <MapContainer
      center={[conductorLat, conductorLng]}
      zoom={14}
      className="w-full h-full"
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap"
      />

      {/* Línea: conductor → origen (cuando el viaje está ACEPTADO) */}
      {estado === "ACEPTADO" && (
        <Polyline positions={rutaOrigen} color="#4FD1C5" weight={4} dashArray="8 6" opacity={0.8} />
      )}

      {/* Línea: origen → destino (cuando el viaje está EN_CURSO) */}
      {estado === "EN_CURSO" && (
        <Polyline positions={rutaViaje} color="#B794F4" weight={4} opacity={0.8} />
      )}

      {/* Marcador: Posición del conductor */}
      <Marker position={[conductorLat, conductorLng]} icon={iconConductor}>
        <Popup>Tu posición actual</Popup>
      </Marker>

      {/* Marcador: Origen (recogida) */}
      <Marker position={[origenLat, origenLng]} icon={iconOrigen}>
        <Popup>Punto de recogida</Popup>
      </Marker>

      {/* Marcador: Destino */}
      <Marker position={[destinoLat, destinoLng]} icon={iconDestino}>
        <Popup>Destino del pasajero</Popup>
      </Marker>

      {/* Seguir al conductor en tiempo real */}
      <SeguirConductor lat={conductorLat} lng={conductorLng} />
    </MapContainer>
  );
}
