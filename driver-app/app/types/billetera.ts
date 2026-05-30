// app/types/billetera.ts

export interface Liquidacion {
  id: string;
  montoPagado: number;
  estado: "PROCESADA";
  fechaEjecutada: string;
}

export interface BilleteraData {
  montoPendiente: number;
  montoLiquidado: number;
  liquidaciones: Liquidacion[];
}

export interface Transaccion {
  id: string;
  idViaje: string;
  monto: string; // Payments devuelve string según el contrato
  metodoPago: "EFECTIVO" | "MERCADO_PAGO";
  estado: "CONFIRMADO" | "PENDIENTE";
  estadoLiquidacion: "PENDIENTE" | "LIQUIDADO";
  fechaCreacion: string;
}