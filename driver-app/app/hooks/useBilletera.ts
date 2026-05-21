// app/hooks/useBilletera.ts
import { useState, useCallback, useEffect } from "react";
import type { BilleteraData, Transaccion } from "@/app/types/billetera";

export function useBilletera(conductorId: string) {
  const [billetera, setBilletera] = useState<BilleteraData | null>(null);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [filtro, setFiltro] = useState<"TODOS" | "PENDIENTE" | "LIQUIDADO">("TODOS");

  const [loadingBilletera, setLoadingBilletera] = useState(true);
  const [loadingTxns, setLoadingTxns] = useState(true);
  const [errorBilletera, setErrorBilletera] = useState<string | null>(null);
  const [errorTxns, setErrorTxns] = useState<string | null>(null);

  const fetchBilletera = useCallback(async () => {
    try {
      setLoadingBilletera(true);
      setErrorBilletera(null);

      const res = await fetch(`/api/payments/conductores/${conductorId}/billetera`);
      if (!res.ok) throw new Error("No se pudo obtener el saldo.");

      const data = await res.json();
      setBilletera(data);
    } catch (err) {
      setErrorBilletera(String(err instanceof Error ? err.message : err));
    } finally {
      setLoadingBilletera(false);
    }
  }, [conductorId]);

  const fetchTransacciones = useCallback(async () => {
    try {
      setLoadingTxns(true);
      setErrorTxns(null);
      const res = await fetch(`/api/payments/conductores/${conductorId}/transacciones`);
      if (!res.ok) throw new Error("No se pudo cargar los movimientos.");
      const data = await res.json();
      if (data && Array.isArray(data.transacciones)) {
        setTransacciones(data.transacciones);
      } else {
        throw new Error("Formato de respuesta inesperado (falta el array 'transacciones')");
      }

    } catch (err) {
      setErrorTxns(String(err instanceof Error ? err.message : err));
      setTransacciones([]);
    } finally {
      setLoadingTxns(false);
    }
  }, [conductorId]);

  useEffect(() => {
    fetchBilletera();
    fetchTransacciones();
  }, [fetchBilletera, fetchTransacciones]);

  const recargar = () => {
    fetchBilletera();
    fetchTransacciones();
  };

  const txnsSeguras = Array.isArray(transacciones) ? transacciones : [];

  const txnsFiltradas = txnsSeguras.filter((t) => {
    if (filtro === "TODOS") return true;
    return t.liquidacion === filtro;
  });

  return {
    billetera,
    transacciones: txnsFiltradas,
    filtro,
    setFiltro,
    loadingBilletera,
    loadingTxns,
    errorBilletera,
    errorTxns,
    recargar,
  };
}