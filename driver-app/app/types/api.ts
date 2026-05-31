/**
 * --------------------------------------------------------------------------
 * ESTADOS CANÓNICOS GLOBALES
 * --------------------------------------------------------------------------
 * Definidos según el acuerdo de plataforma para mantener consistencia.
 */
export type EstadoSolicitud =
  | 'BUSCANDO_CONDUCTOR'
  | 'ACEPTADA'
  | 'CANCELADA_POR_PASAJERO'
  | 'EXPIRADA_SIN_ACEPTACION';

export type EstadoViaje =
  | 'ACEPTADO'
  | 'EN_CURSO'
  | 'FINALIZADO'
  | 'CANCELADO_POR_CONDUCTOR';

export type EstadoReporte =
  | 'PENDIENTE'
  | 'APROBADO'
  | 'RECHAZADO';

export type EstadoPago =
  | 'PENDING'
  | 'CAPTURED'
  | 'FAILED';

export type MotivoCancelacionPasajero =
  | 'DESISTIO'
  | 'TIEMPO_EXCEDIDO'
  | 'ERROR_ORIGEN_DESTINO';

export type MetodoDePago =
  | 'EFECTIVO'
  | 'TARJETA';

/**
 * --------------------------------------------------------------------------
 * DRIVER APP DTOs
 * --------------------------------------------------------------------------
 */

// GET /api/viajes/{id_viaje}/estado
export interface VerificarEstadoViajeResponse {
  id_viaje: string;
  estado_actual: EstadoViaje;
  id_conductor: string;
  id_pasajero: string;
  tiempo_completado?: string;
}

// POST /api/conductor/reputacion
export interface ActualizarReputacionConductorRequest {
  id_conductor: string;
  puntaje: number;
}

// POST /api/viajes (Conductor acepta solicitud)
export interface CrearViajeDriverRequest {
  id_solicitud: string;
  id_conductor: string;
  id_vehiculo: string;
  latitud_actual: number;
  longitud_actual: number;
}

// GET /api/viajes/{id_viaje}/telemetria
export interface TelemetriaViajeResponse {
  id_viaje: string;
  coordenadas: {
    lat: number;
    lng: number;
  };
  rumbo: number;
  velocidad_kmh: number;
  ultima_actualizacion: string; // ISO 8601 Date
}

/**
 * --------------------------------------------------------------------------
 * RIDER APP DTOs
 * --------------------------------------------------------------------------
 */

export interface SolicitudViaje {
  id_solicitud: string;
  id_pasajero: string;
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
  precio_estimado: number;
  metodo_pago: MetodoDePago;
  created_at: string;
  distance_m?: number;
  eta_min?: number;
  pasajero: {
    id_pasajero: string;
    nombre: string;
  };
}

// GET /api/solicitudes (Endpoint F)
export interface ListarSolicitudesResponse {
  total: number;
  limit: number;
  offset: number;
  solicitudes: SolicitudViaje[];
}

// POST /api/viajes (Sincronización desde Driver App)
export type SincronizarViajeRiderRequest = CrearViajeDriverRequest;

export interface SincronizarViajeRiderResponse {
  id_viaje: string;
  estado_actual: EstadoViaje;
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


// POST /api/notificaciones/viajes/{id_viaje}/estado
export interface NotificarEstadoViajeRequest {
  id_viaje: string;
  id_pasajero: string;
  estado_actual: EstadoViaje;
  fuente: 'DRIVER_APP' | 'SYSTEM';
}

// POST /api/viajes/{id_viaje}/pago-confirmado (Webhook)
export interface WebhookPagoConfirmadoRequest {
  id_transaccion: string;
  estado: EstadoPago;
  monto: number;
}

// PATCH /api/solicitudes/{id_solicitud}
export interface CancelarSolicitudRequest {
  id_pasajero: string;
  estado: Extract<EstadoSolicitud, 'CANCELADA_POR_PASAJERO'>;
  motivo: MotivoCancelacionPasajero;
}

export interface CancelarSolicitudResponse {
  id_solicitud: string;
  estado: EstadoSolicitud;
}

/**
 * --------------------------------------------------------------------------
 * PAYMENTS APP DTOs
 * --------------------------------------------------------------------------
 */

// POST /api/pagos/methods
export interface AgregarMetodoPagoRequest {
  id_usuario: string;
  cvv: string;
  marca_tarjeta: string;
  numero_tarjeta: string;
  mes_vencimiento: number;
  año_vencimiento: number;
  direccion_facturacion: string;
}

// POST /api/pagos/{id_transaccion}/refunds
export interface SolicitarReembolsoRequest {
  monto: number;
  razon: string;
  id_pasajero: string;
}

export interface SolicitarReembolsoResponse {
  id_reembolso: string;
  id_transaccion: string;
  estado: EstadoPago;
}

// PUT /api/pagos/transacciones
export interface ProcesarCobroRequest {
  id_transaccion: string;
}

export interface ProcesarCobroResponse {
  id_transaccion: string;
  estado: EstadoPago;
}

/**
 * --------------------------------------------------------------------------
 * FEEDBACK APP DTOs
 * --------------------------------------------------------------------------
 */

// POST /api/resenas (Compartido para Conductor y Pasajero)
export interface CrearResenaRequest {
  id_viaje: string;
  id_emisor: string;
  id_receptor: string;
  puntaje: number;
  comentario: string;
}

export interface CrearResenaResponse {
  id_calificacion: string;
  estado: 'REGISTRADA';
  timestamp: string; // ISO 8601
}

// POST /api/pasajero/reputacion
export interface ActualizarReputacionPasajeroRequest {
  id_pasajero: string;
  puntaje: number;
}

// POST /api/reportes
export interface CrearReporteRequest {
  id_reportante: string;
  id_calificacion: string;
  motivo: string;
  descripcion: string;
}

export interface CrearReporteResponse {
  id_reporte: string;
  estado: EstadoReporte;
  timestamp: string;
}

// GET /api/usuarios/{id_usuario}/calificaciones
export interface CalificacionDetalle {
  id_calificacion: string;
  id_viaje: string;
  puntaje: number;
  comentario: string;
  id_emisor: string;
  timestamp: string;
}

export interface HistorialCalificacionesResponse {
  id_usuario: string;
  calificacion_promedio: number;
  total_calificaciones: number;
  detalles: CalificacionDetalle[];
}

// GET /api/reportes?estado=PENDIENTE
export interface ReporteDetalle {
  id_reporte: string;
  id_calificacion: string;
  id_reportante: string;
  motivo: string;
  descripcion: string;
  estado: EstadoReporte;
  timestamp: string;
}

export interface ListarReportesResponse {
  total: number;
  reportes: ReporteDetalle[];
}

// PATCH /api/reportes/{id_reporte}/resolver
export interface ResolverReporteRequest {
  estado: Extract<EstadoReporte, 'APROBADO' | 'RECHAZADO'>;
  id_moderador: string;
  accion: 'ELIMINAR_CALIFICACION' | 'ADVERTENCIA_USUARIO' | 'NINGUNA';
  notas: string;
}

export interface ResolverReporteResponse {
  id_reporte: string;
  estado: EstadoReporte;
  timestamp_resolucion: string;
  calificacion_eliminada?: string;
}