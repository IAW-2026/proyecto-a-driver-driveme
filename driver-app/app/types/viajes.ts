/**
 * app/types/viajes.ts
 * -----------------------------------------------------------------------
 * Tipos del dominio de viajes usados en Client Components.
 * SolicitudViaje: estructura que llega del endpoint de solicitudes
 * de la Rider App.
 * -----------------------------------------------------------------------
 */

export interface SolicitudViaje {
  /** ID de la solicitud en la Rider App */
  id_solicitud: string;
  precio_estimado: number;
  eta_min: number;
  distancia_km: number;
  pasajero: {
    id_pasajero: string;
    nombre: string;
  };
  origen: {
    direccion: string;
    latitud: number;
    longitud: number;
  };
  destino: {
    direccion: string;
    latitud: number;
    longitud: number;
  };
}
