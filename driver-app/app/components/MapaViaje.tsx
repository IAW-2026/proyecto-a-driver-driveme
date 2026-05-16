"use client";

/**
 * app/components/MapaViaje.tsx
 * -----------------------------------------------------------------------
 * Mapa Leaflet para la pantalla de Viaje en Curso.
 * Importado dinámicamente (ssr: false) en su componente padre.
 * -----------------------------------------------------------------------
 */

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";

// Interfaces para tipar la respuesta de OSRM
interface OSRMResponse {
  routes?: {
    geometry: {
      coordinates: [number, number][]; // [lng, lat]
    };
  }[];
}


const iconOrigen = L.divIcon({
  className: "bg-transparent",
  html: `<div style="background:#CFFF04; width:16px; height:16px; border:3px solid #09090B; box-shadow: 2px 2px 0px 0px #09090b;"></div>`,
  iconAnchor: [8, 8],
});

const iconDestino = L.divIcon({
  className: "bg-transparent",
  html: `<div style="background:#FF007F; width:16px; height:16px; border:3px solid #09090B; box-shadow: 2px 2px 0px 0px #09090b;"></div>`,
  iconAnchor: [8, 8],
});

const iconConductor = L.divIcon({
  className: "bg-transparent",
  html: `<div style="background:#09090B; width:20px; height:20px; border:3px solid #CFFF04; box-shadow: 3px 3px 0px 0px rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center;"></div>`,
  iconAnchor: [10, 10],
});

// ── Componente Auxiliar: Centrado Automático ──────────────────────────────
function SeguirConductor({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

// ── Props y Componente Principal ──────────────────────────────────────────
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

  // Fix seguro para íconos por defecto de Leaflet en Next.js
  useEffect(() => {
    // Solo aplicar el fix si la propiedad de Leaflet aún existe y no ha sido purgada
    if (L.Icon && L.Icon.Default && L.Icon.Default.prototype) {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
    }
  }, []);

  // Fetch ruta: Conductor -> Origen
  useEffect(() => {
    if (estado !== "ACEPTADO") return;

    let isMounted = true;
    setRutaOrigen([[conductorLat, conductorLng], [origenLat, origenLng]]); // Fallback

    fetch(
      `https://router.project-osrm.org/route/v1/driving/${conductorLng},${conductorLat};${origenLng},${origenLat}?overview=full&geometries=geojson`
    )
      .then((res) => res.json())
      .then((data: OSRMResponse) => {
        if (!isMounted) return; // Evita memory leaks si el componente se desmonta o actualiza rápido
        if (data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]] as [number, number]);
          setRutaOrigen(coords);
        }
      })
      .catch((err) => console.error("Error al obtener ruta OSRM:", err));

    return () => {
      isMounted = false;
    };
  }, [conductorLat, conductorLng, origenLat, origenLng, estado]);

  // Fetch ruta: Origen -> Destino
  useEffect(() => {
    if (estado !== "EN_CURSO") return;

    let isMounted = true;
    setRutaViaje([[origenLat, origenLng], [destinoLat, destinoLng]]); // Fallback

    fetch(
      `https://router.project-osrm.org/route/v1/driving/${origenLng},${origenLat};${destinoLng},${destinoLat}?overview=full&geometries=geojson`
    )
      .then((res) => res.json())
      .then((data: OSRMResponse) => {
        if (!isMounted) return;
        if (data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]] as [number, number]);
          setRutaViaje(coords);
        }
      })
      .catch((err) => console.error("Error al obtener ruta OSRM:", err));

    return () => {
      isMounted = false;
    };
  }, [origenLat, origenLng, destinoLat, destinoLng, estado]);

  return (
    <MapContainer
      center={[conductorLat, conductorLng]}
      zoom={15}
      className="w-full h-full"
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Línea Neobrutalista: conductor → origen (ACEPTADO) */}
      {estado === "ACEPTADO" && (
        <Polyline
          positions={rutaOrigen}
          color="#09090B"
          weight={6}
          dashArray="10 10"
          lineCap="square"
        />
      )}

      {/* Línea Neobrutalista: origen → destino (EN_CURSO) */}
      {estado === "EN_CURSO" && (
        <Polyline
          positions={rutaViaje}
          color="#09090B"
          weight={6}
          lineCap="square"
        />
      )}

      {/* Marcadores */}
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