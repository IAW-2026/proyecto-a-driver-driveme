// app/billetera/BilleteraClient.tsx
"use client";

import { Wallet, Clock, TrendingUp, RefreshCw, Receipt, Banknote, Smartphone, ChevronRight, AlertTriangle } from "lucide-react";
import ThemeToggle from "@/app/components/ThemeToggle";
import Sidebar from "@/app/components/Nav";
import HeaderModulo from "@/app/components/HeaderModulo";
import StatusBadge from "@/app/components/EtiquetaEstado";
import EstadoVacio from "@/app/components/EstadoVacio";
import { formatARS, formatFecha } from "@/lib/formatters";
import type { BilleteraClientProps } from "@/app/types/billetera";
import { useBilletera } from "@/app/hooks/useBilletera";

export default function BilleteraClient({ rol, conductorId }: BilleteraClientProps) {
  const {
    billetera,
    transacciones,
    filtro,
    setFiltro,
    loadingBilletera,
    loadingTxns,
    errorBilletera,
    errorTxns,
    recargar,
  } = useBilletera(conductorId);

  return (
    <div className="flex min-h-screen w-full bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-white font-sans">
      <Sidebar rol={rol} />

      <main className="flex-1 pt-8 pb-24 md:pb-8 md:pl-72 px-4 md:px-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">

          <HeaderModulo
            titulo="Mi Billetera"
            icono={Wallet}
            acciones={
              <>
                <button
                  onClick={recargar}
                  className="p-2 rounded-xl border-2 border-zinc-950 bg-white dark:bg-zinc-900 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#09090b] dark:hover:shadow-[4px_4px_0px_0px_#CFFF04] transition-all"
                >
                  <RefreshCw className={`w-5 h-5 ${(loadingBilletera || loadingTxns) ? 'animate-spin' : ''}`} strokeWidth={3} />
                </button>
                <ThemeToggle />
              </>
            }
          />

          <section className="space-y-4">
            {errorBilletera && (
              <div className="p-4 rounded-xl border-2 border-zinc-950 bg-[#FF007F] text-white shadow-[4px_4px_0px_0px_#09090b] dark:shadow-[4px_4px_0px_0px_#FF007F] flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 shrink-0" strokeWidth={3} />
                <p className="text-sm font-bold uppercase tracking-wider">Error: {errorBilletera}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative overflow-hidden rounded-2xl border-4 border-zinc-950 bg-brand shadow-[8px_8px_0px_0px_#09090b] dark:shadow-[8px_8px_0px_0px_#CFFF04] p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-800">Saldo a Liquidar</p>
                    <p className="text-[10px] font-bold text-zinc-700 mt-1 uppercase">Cierre: Domingo 23:59hs</p>
                  </div>
                  <Clock className="w-6 h-6 text-zinc-950" strokeWidth={3} />
                </div>
                <p className="text-4xl md:text-5xl font-black text-zinc-950 tracking-tighter">
                  {loadingBilletera ? "..." : formatARS(billetera?.saldo_a_liquidar ?? 0)}
                </p>
              </div>

              <div className="relative overflow-hidden rounded-2xl border-4 border-zinc-950 bg-white dark:bg-zinc-900 dark:border-white shadow-[8px_8px_0px_0px_#09090b] dark:shadow-[8px_8px_0px_0px_#ffffff] p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Histórico Total</p>
                    <p className="text-[10px] font-bold text-zinc-400 mt-1 uppercase">Ganancias acumuladas</p>
                  </div>
                  <TrendingUp className="w-6 h-6 text-info" strokeWidth={3} />
                </div>
                <p className="text-4xl md:text-5xl font-black tracking-tighter">
                  {loadingBilletera ? "..." : formatARS(billetera?.saldo_liquidado ?? 0)}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Receipt className="w-6 h-6" strokeWidth={3} />
                <h2 className="text-xl font-black uppercase tracking-tight">Movimientos</h2>
              </div>
              <div className="flex bg-zinc-200 dark:bg-zinc-800 p-1 rounded-xl border-2 border-zinc-950">
                {(["TODOS", "PENDIENTE", "LIQUIDADO"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFiltro(f)}
                    className={`flex-1 sm:flex-none text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-lg transition-all ${filtro === f
                      ? "bg-brand text-zinc-950 shadow-[2px_2px_0px_0px_#09090b]"
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                      }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {errorTxns ? (
                <div className="p-4 rounded-xl border-2 border-zinc-950 bg-[#FF007F] text-white shadow-[4px_4px_0px_0px_#09090b] dark:shadow-[4px_4px_0px_0px_#FF007F] flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 shrink-0" strokeWidth={3} />
                  <p className="text-sm font-bold uppercase tracking-wider">Error: {errorTxns}</p>
                </div>
              ) : transacciones.length === 0 && !loadingTxns ? (
                <EstadoVacio
                  icono={Receipt}
                  titulo="No hay movimientos para mostrar"
                  descripcion="Las transacciones de tus viajes finalizados aparecerán reflejadas en esta lista."
                />
              ) : (
                transacciones.map((txn) => (
                  <div
                    key={txn.id_transaccion}
                    className="group flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border-2 border-zinc-950 bg-white dark:bg-zinc-900 dark:border-zinc-800 p-4 hover:shadow-[4px_4px_0px_0px_#09090b] dark:hover:shadow-[4px_4px_0px_0px_#CFFF04] transition-all"
                  >
                    <div className={`w-12 h-12 shrink-0 flex items-center justify-center rounded-xl border-2 border-zinc-950 ${txn.tipo === "EFECTIVO" ? "bg-brand" : "bg-[#009EE3]"}`}>
                      {txn.tipo === "EFECTIVO" ? <Banknote className="w-6 h-6 text-zinc-950" /> : <Smartphone className="w-6 h-6 text-white" />}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black uppercase text-sm tracking-wide">{txn.tipo.replace("_", " ")}</span>
                        <StatusBadge estado={txn.liquidacion} size="sm" />
                      </div>
                      <p className="text-xs font-bold text-zinc-500 mt-1 uppercase">
                        Viaje: {txn.id_viaje.slice(0, 8)} • {formatFecha(txn.fecha)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t-2 sm:border-t-0 border-zinc-100 dark:border-zinc-800 pt-3 sm:pt-0">
                      <p className="text-2xl font-black tracking-tight">{formatARS(txn.monto)}</p>
                      <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}