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
import ThemeToggle from "@/app/components/ThemeToggle";
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
    <div className="flex min-h-screen w-full bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-white font-sans">
      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={ocultarToast} />}
      <Sidebar rol={rol} />

      <main className="flex-1 pt-8 pb-24 md:pb-8 md:pl-72 px-4 md:px-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-8">

          <HeaderModulo
            titulo="Mi Billetera"
            icono={Wallet}
            acciones={<ThemeToggle />}
          />

          {/* ── Tarjetas de Saldo ─────────────────────────────────────────────── */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">

            {/* Saldo Pendiente */}
            <div className="relative overflow-hidden rounded-2xl border-4 border-zinc-950 bg-brand shadow-[8px_8px_0px_0px_#09090b] dark:shadow-[8px_8px_0px_0px_#CFFF04] p-5 md:p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-800">
                    Saldo a Liquidar
                  </p>
                  <p className="text-[10px] font-bold text-zinc-700 mt-1 uppercase">
                    Cierre: Domingo 23:59hs
                  </p>
                </div>
                <Clock className="w-6 h-6 text-zinc-950 shrink-0" strokeWidth={3} />
              </div>
              <p className="text-3xl md:text-5xl font-black text-zinc-950 tracking-tighter">
                {formatARS(billetera?.montoPendiente ?? 0)}
              </p>

              <button
                onClick={handleSolicitarLiquidacion}
                disabled={isPending || (billetera?.montoPendiente ?? 0) === 0}
                className="mt-5 w-full py-3 px-4 rounded-xl border-2 border-zinc-950 bg-white text-zinc-950 font-extrabold text-sm uppercase tracking-wide shadow-[4px_4px_0px_0px_#09090b] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#09090b] active:translate-y-0 active:shadow-[2px_2px_0px_0px_#09090b] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_0px_#09090b]"
              >
                {isPending ? "Procesando..." : "Solicitar Liquidación"}
              </button>
            </div>

            {/* Histórico Total */}
            <div className="relative overflow-hidden rounded-2xl border-4 border-zinc-950 bg-white dark:bg-zinc-900 dark:border-white shadow-[8px_8px_0px_0px_#09090b] dark:shadow-[8px_8px_0px_0px_#ffffff] p-5 md:p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                    Histórico Total
                  </p>
                  <p className="text-[10px] font-bold text-zinc-400 mt-1 uppercase">
                    Ganancias acumuladas
                  </p>
                </div>
                <TrendingUp className="w-6 h-6 text-info shrink-0" strokeWidth={3} />
              </div>
              <p className="text-3xl md:text-5xl font-black tracking-tighter">
                {formatARS(billetera?.montoLiquidado ?? 0)}
              </p>
            </div>
          </section>

          {/* ── Historial de Liquidaciones ─────────────────────────────────────── */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <ArrowDownToLine className="w-5 h-5 shrink-0" strokeWidth={3} />
              <h2 className="text-lg md:text-xl font-black uppercase tracking-tight">
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
                    className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border-2 border-zinc-950 bg-white dark:bg-zinc-900 dark:border-zinc-800 p-4"
                  >
                    {/* Icono */}
                    <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl border-2 border-zinc-950 bg-zinc-950 dark:bg-zinc-700">
                      <CheckCircle className="w-5 h-5 text-brand" strokeWidth={2.5} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black uppercase text-sm tracking-wide">
                          Liquidación procesada
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border-2 border-zinc-950 bg-brand text-zinc-950">
                          {liq.estado}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs font-bold text-zinc-500 uppercase">
                        <CalendarDays className="w-3 h-3" />
                        <span>{formatFecha(liq.fechaEjecutada)}</span>
                      </div>
                    </div>

                    {/* Monto */}
                    <p className="text-xl md:text-2xl font-black tracking-tight border-t-2 sm:border-t-0 border-zinc-100 dark:border-zinc-800 pt-3 sm:pt-0">
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
                <Receipt className="w-5 h-5 shrink-0" strokeWidth={3} />
                <h2 className="text-lg md:text-xl font-black uppercase tracking-tight">
                  Movimientos
                </h2>
              </div>

              {/* Filtros URL State */}
              <div className="flex bg-zinc-200 dark:bg-zinc-800 p-1 rounded-xl border-2 border-zinc-950 w-full sm:w-auto">
                {(["TODOS", "PENDIENTE", "LIQUIDADO"] as const).map((f) => (
                  <Link
                    key={f}
                    href={`/billetera?filtro=${f}&page=1`}
                    className={`flex-1 sm:flex-none text-center text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-lg transition-all ${
                      currentFiltro === f
                        ? "bg-brand text-zinc-950 shadow-[2px_2px_0px_0px_#09090b]"
                        : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
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
                    className="group flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 rounded-2xl border-2 border-zinc-950 bg-white dark:bg-zinc-900 dark:border-zinc-800 p-4 hover:shadow-[4px_4px_0px_0px_#09090b] dark:hover:shadow-[4px_4px_0px_0px_#CFFF04] transition-all"
                  >
                    {/* Icono método de pago */}
                    <div
                      className={`w-11 h-11 shrink-0 flex items-center justify-center rounded-xl border-2 border-zinc-950 ${
                        txn.metodoPago === "EFECTIVO" ? "bg-brand" : "bg-[#009EE3]"
                      }`}
                    >
                      {txn.metodoPago === "EFECTIVO" ? (
                        <Banknote className="w-5 h-5 text-zinc-950" />
                      ) : (
                        <Smartphone className="w-5 h-5 text-white" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black uppercase text-sm tracking-wide">
                          {txn.metodoPago.replace("_", " ")}
                        </span>
                        <StatusBadge estado={txn.estadoLiquidacion} size="sm" />
                      </div>
                      <p className="text-xs font-bold text-zinc-500 mt-1 uppercase truncate">
                        Viaje: {txn.idViaje.slice(0, 8)}… • {formatFecha(txn.fechaCreacion)}
                      </p>
                    </div>

                    {/* Monto */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t-2 sm:border-t-0 border-zinc-100 dark:border-zinc-800 pt-3 sm:pt-0">
                      <p className="text-xl md:text-2xl font-black tracking-tight">
                        {formatARS(parseFloat(txn.monto))}
                      </p>
                      <ChevronRight
                        className="w-5 h-5 text-zinc-400 group-hover:translate-x-1 transition-transform shrink-0"
                        strokeWidth={3}
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