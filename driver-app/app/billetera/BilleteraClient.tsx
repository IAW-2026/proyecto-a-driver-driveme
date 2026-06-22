// app/billetera/BilleteraClient.tsx
"use client";

import Link from "next/link";
import {
  Wallet,
  Clock,
  TrendingUp,
  Receipt,
  Banknote,
  Smartphone,
  ChevronRight,
  ArrowDownToLine,
  CheckCircle,
  CalendarDays,
} from "lucide-react";
import Sidebar from "@/app/components/Nav";
import HeaderModulo from "@/app/components/HeaderModulo";
import StatusBadge from "@/app/components/EtiquetaEstado";
import EstadoVacio from "@/app/components/EstadoVacio";
import { formatARS, formatFecha } from "@/lib/formatters";
import type { BilleteraData, Transaccion, Liquidacion } from "@/app/types/billetera";
import type { Rol } from "@/lib/getSessionData";
import PaginadorURL from "@/app/components/admin/PaginadorURL";
import { useTransition } from "react";
import { useToast } from "@/app/hooks/useToast";
import { solicitarLiquidacionAction } from "@/app/actions/conductor/solicitarLiquidacion";
import Toast from "@/app/components/Toast";

interface BilleteraClientProps {
  rol: Rol;
  billetera: BilleteraData | null;
  transacciones: Transaccion[];
  currentPage: number;
  totalPages: number;
  currentFiltro: string;
}

export default function BilleteraClient({
  rol,
  billetera,
  transacciones,
  currentPage,
  totalPages,
  currentFiltro,
}: BilleteraClientProps) {
  const [isPending, startTransition] = useTransition();
  const { toast, mostrarToast, ocultarToast } = useToast();

  const liquidaciones: Liquidacion[] = billetera?.liquidaciones ?? [];

  const handleSolicitarLiquidacion = () => {
    startTransition(async () => {
      const result = await solicitarLiquidacionAction();
      if (result.success) {
        mostrarToast(
          `¡Liquidación de ${formatARS(result.data?.montoPagado || 0)} solicitada!`,
          "ok"
        );
      } else {
        mostrarToast(result.error || "Ocurrió un error al liquidar.", "error");
      }
    });
  };

  return (
    <div className="flex min-h-screen w-full font-sans">
      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={ocultarToast} />}
      <Sidebar rol={rol} />

      <main className="flex-1 pt-8 md:pt-28 pb-24 md:pb-8 px-4 md:px-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-8">

          <HeaderModulo
            titulo="Mi Billetera"
            icono={Wallet}
          />

          {/* ── Tarjetas de Saldo ─────────────────────────────────────────────── */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">

            {/* Saldo Pendiente */}
            <div className="relative overflow-hidden rounded-modal border border-primary-dark bg-[rgba(20,0,0,0.4)] backdrop-blur-md shadow-[0_0_30px_rgba(220,38,38,0.15)] p-6 md:p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] font-sci uppercase tracking-[0.2em] text-[#9CA3AF]">
                    Saldo a Liquidar
                  </p>
                  <p className="text-[10px] font-bold text-red-400 mt-1 uppercase tracking-wider drop-shadow-[0_0_5px_rgba(220,38,38,0.5)]">
                    Cierre: Domingo 23:59hs
                  </p>
                </div>
                <div className="bg-[rgba(220,38,38,0.1)] p-2 rounded-full border border-[rgba(220,38,38,0.3)] shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                   <Clock className="w-5 h-5 text-primary shrink-0 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]" strokeWidth={2} aria-hidden="true" />
                </div>
              </div>
              <p className="text-4xl md:text-5xl font-sci text-white tracking-tighter drop-shadow-[0_0_10px_rgba(220,38,38,0.3)] mt-2">
                {formatARS(billetera?.montoPendiente ?? 0)}
              </p>

              <button
                onClick={handleSolicitarLiquidacion}
                disabled={isPending || (billetera?.montoPendiente ?? 0) === 0}
                className="mt-6 w-full py-3.5 px-4 rounded-full border border-[rgba(220,38,38,0.4)] bg-[rgba(220,38,38,0.1)] text-red-400 font-sci text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(220,38,38,0.2)] hover:bg-[rgba(220,38,38,0.2)] hover:translate-y-[-1px] hover:shadow-[0_0_25px_rgba(220,38,38,0.3)] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 backdrop-blur-sm"
              >
                {isPending ? "Procesando..." : "Solicitar Liquidación"}
              </button>
            </div>

            {/* Histórico Total */}
            <div className="relative overflow-hidden rounded-modal border border-[rgba(255,255,255,0.1)] bg-[rgba(10,10,10,0.6)] backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)] p-6 md:p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] font-sci uppercase tracking-[0.2em] text-[#9CA3AF]">
                    Histórico Total
                  </p>
                  <p className="text-[10px] font-bold text-[#9CA3AF] mt-1 uppercase tracking-wider">
                    Ganancias acumuladas
                  </p>
                </div>
                <div className="bg-[rgba(59,130,246,0.1)] p-2 rounded-full border border-[rgba(59,130,246,0.3)] shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                  <TrendingUp className="w-5 h-5 text-info shrink-0 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" strokeWidth={2} aria-hidden="true" />
                </div>
              </div>
              <p className="text-4xl md:text-5xl font-sci tracking-tighter text-white mt-2">
                {formatARS(billetera?.montoLiquidado ?? 0)}
              </p>
            </div>
          </section>

          {/* ── Historial de Liquidaciones ─────────────────────────────────────── */}
          <section className="space-y-5 rounded-modal border border-[rgba(220,38,38,0.25)] bg-[rgba(10,10,10,0.7)] backdrop-blur-md shadow-[0_0_30px_rgba(220,38,38,0.1)] p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="bg-[rgba(220,38,38,0.1)] p-2 rounded-full border border-[rgba(220,38,38,0.3)]">
                <ArrowDownToLine className="w-4 h-4 text-primary shrink-0 drop-shadow-[0_0_5px_rgba(220,38,38,0.8)]" strokeWidth={2} aria-hidden="true" />
              </div>
              <h2 className="text-base font-sci uppercase tracking-widest text-white">
                Historial de Liquidaciones
              </h2>
            </div>

            {liquidaciones.length === 0 ? (
              <EstadoVacio
                icono={ArrowDownToLine}
                titulo="Todavía no tenés liquidaciones"
                descripcion="Cuando solicites una liquidación de tus ganancias, aparecerá el registro aquí."
              />
            ) : (
              <div className="space-y-3">
                {liquidaciones.map((liq) => (
                  <div
                    key={liq.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-card border border-[rgba(255,255,255,0.06)] bg-[#141414] p-4"
                  >
                    {/* Icono */}
                    <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-sharp border border-[rgba(5,150,105,0.3)] bg-[rgba(5,150,105,0.1)]">
                      <CheckCircle className="w-5 h-5 text-[#059669]" strokeWidth={2.5} aria-hidden="true" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold uppercase text-sm tracking-wide text-white">
                          Liquidación procesada
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sharp border border-[#059669]/50 bg-[rgba(5,150,105,0.15)] text-[#34D399] shadow-[0_0_10px_rgba(5,150,105,0.1)]">
                          {liq.estado}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs font-bold text-[#9CA3AF] uppercase">
                        <CalendarDays className="w-3 h-3" aria-hidden="true" />
                        <span>{formatFecha(liq.fechaEjecutada)}</span>
                      </div>
                    </div>

                    {/* Monto */}
                    <p className="text-xl md:text-2xl font-black tracking-tight text-white border-t sm:border-t-0 border-[rgba(255,255,255,0.06)] pt-3 sm:pt-0">
                      {formatARS(liq.montoPagado)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Movimientos (Transacciones) ───────────────────────────────────── */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary shrink-0" strokeWidth={2.5} aria-hidden="true" />
                <h2 className="text-lg md:text-xl font-extrabold uppercase tracking-widest text-white">
                  Movimientos
                </h2>
              </div>

              {/* Filtros URL State */}
              <div className="flex bg-[#141414] p-1 rounded-card border border-[rgba(255,255,255,0.06)] w-full sm:w-auto">
                {(["TODOS", "PENDIENTE", "LIQUIDADO"] as const).map((f) => (
                  <Link
                    key={f}
                    href={`/billetera?filtro=${f}&page=1`}
                    className={`flex-1 sm:flex-none text-center text-[10px] font-extrabold uppercase tracking-widest px-3 py-2 rounded-sharp transition-all ${
                      currentFiltro === f
                        ? "bg-[rgba(220,38,38,0.15)] text-red-400 border border-red-400/30 shadow-[0_0_10px_rgba(220,38,38,0.1)]"
                        : "text-[#9CA3AF] hover:text-white border border-transparent"
                    }`}
                  >
                    {f}
                  </Link>
                ))}
              </div>
            </div>

            {/* Listado */}
            <div className="space-y-3">
              {transacciones.length === 0 ? (
                <EstadoVacio
                  icono={Receipt}
                  titulo="No hay movimientos para mostrar"
                  descripcion="Las transacciones de tus viajes finalizados aparecerán reflejadas en esta lista."
                />
              ) : (
                transacciones.map((txn) => (
                  <div
                    key={txn.id}
                    className="group flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 rounded-card border border-[rgba(255,255,255,0.06)] bg-[#141414] p-4 hover:bg-[#1F1F1F] transition-colors"
                  >
                    {/* Icono método de pago */}
                    <div
                      className={`w-11 h-11 shrink-0 flex items-center justify-center rounded-sharp border ${
                        txn.metodoPago === "EFECTIVO" ? "bg-[rgba(220,38,38,0.1)] border-primary/30" : "bg-[rgba(59,130,246,0.1)] border-info/30"
                      }`}
                    >
                      {txn.metodoPago === "EFECTIVO" ? (
                        <Banknote className="w-5 h-5 text-primary" aria-hidden="true" />
                      ) : (
                        <Smartphone className="w-5 h-5 text-info" aria-hidden="true" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold uppercase text-sm tracking-wide text-white">
                          {txn.metodoPago.replace("_", " ")}
                        </span>
                        <StatusBadge estado={txn.estadoLiquidacion} size="sm" />
                      </div>
                      <p className="text-xs font-bold text-[#9CA3AF] mt-1 uppercase truncate">
                        Viaje: <span className="font-mono text-[#9CA3AF]">{txn.idViaje.slice(0, 8)}…</span> • {formatFecha(txn.fechaCreacion)}
                      </p>
                    </div>

                    {/* Monto */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-[rgba(255,255,255,0.06)] pt-3 sm:pt-0">
                      <p className="text-xl md:text-2xl font-black tracking-tight text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">
                        {formatARS(parseFloat(txn.monto))}
                      </p>
                      <ChevronRight
                        className="w-5 h-5 text-[#6B7280] group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0"
                        strokeWidth={2.5}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <PaginadorURL paginaActual={currentPage} totalPaginas={totalPages} />
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}