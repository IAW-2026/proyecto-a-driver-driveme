// lib/formatters.ts

/**
 * Formatea un número como moneda de curso legal argentina (ARS)
 */
export const formatARS = (monto: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(monto);
};

/**
 * Formatea una fecha u objeto Date al formato estándar de la aplicación: "21 may 2026, 11:30"
 */
export const formatFecha = (fecha: Date | string | null | undefined): string => {
  if (!fecha) return "-";

  const objetoFecha = typeof fecha === "string" ? new Date(fecha) : fecha;

  return objetoFecha.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
};