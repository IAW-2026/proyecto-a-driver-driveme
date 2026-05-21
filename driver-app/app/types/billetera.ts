// app/types/billetera.ts

export interface BilleteraData {
  saldo_a_liquidar: number;
  saldo_liquidado: number;
}

export interface Transaccion {
  id_transaccion: string;
  id_viaje: string;
  monto: number;
  tipo: "EFECTIVO" | "MERCADO_PAGO";
  liquidacion: "PENDIENTE" | "LIQUIDADO";
  fecha: string;
}

export interface BilleteraClientProps {
  rol: string;
  conductorId: string;
}