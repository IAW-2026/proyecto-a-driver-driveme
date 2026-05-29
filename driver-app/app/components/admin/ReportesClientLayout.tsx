// app/components/admin/ReportesClientLayout.tsx
"use client";

import { useState, useCallback } from "react";
import { Eye, MapPin, Flag } from "lucide-react";
import AdminTabla from "@/app/components/admin/AdminTabla";
import ViajeDetalleModal, { type ViajeDetalle } from "@/app/components/admin/ViajeDetalleModal";

// ─── Types ────────────────────────────────────────────────────────────────────

// The serialised shape passed down from the Server Component.
// All Dates are pre-converted to ISO strings.
export type ViajeSerializado = ViajeDetalle & {
  // Display helpers pre-formatted on the server
  fecha_display: string;       // e.g. "21 may 2026, 11:30"
  monto_display: string;       // e.g. "$ 3.500"
  conductor_display: string;   // e.g. "García, Nicolás"
};

interface ReportesClientLayoutProps {
  viajes: ViajeSerializado[];
}

// ─── Badge ────────────────────────────────────────────────────────────────────

const ESTADO_ESTILOS: Record<string, string> = {
  FINALIZADO:
    "bg-brand text-zinc-950 border-zinc-950 dark:border-brand dark:shadow-[2px_2px_0px_0px_#CFFF04]",
  EN_CURSO:
    "bg-info text-white border-zinc-950 dark:border-info dark:shadow-[2px_2px_0px_0px_#8B5CF6]",
  ACEPTADO:
    "bg-zinc-200 text-zinc-700 border-zinc-950 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-600",
  CANCELADO_POR_CONDUCTOR:
    "bg-alert text-white border-zinc-950 dark:border-alert dark:shadow-[2px_2px_0px_0px_#FF007F]",
};
const ESTADO_ETIQUETAS: Record<string, string> = {
  FINALIZADO: "Finalizado",
  EN_CURSO: "En Curso",
  ACEPTADO: "Aceptado",
  CANCELADO_POR_CONDUCTOR: "Cancelado",
};

function BadgeEstadoViaje({ estado }: { estado: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-lg border-2 text-[10px] font-extrabold uppercase tracking-widest shadow-[2px_2px_0px_0px_#09090b] ${ESTADO_ESTILOS[estado] ?? ESTADO_ESTILOS.ACEPTADO}`}
    >
      {ESTADO_ETIQUETAS[estado] ?? estado}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReportesClientLayout({ viajes }: ReportesClientLayoutProps) {
  const [viajeSeleccionado, setViajeSeleccionado] = useState<ViajeDetalle | null>(null);
  const handleClose = useCallback(() => setViajeSeleccionado(null), []);

  // ── Desktop table column definitions ─────────────────────────────────────────
  const columnas: Parameters<typeof AdminTabla<ViajeSerializado>>[0]["columnas"] = [
    {
      cabecera: "Fecha",
      render: (v) => (
        <span className="font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
          {v.fecha_display}
        </span>
      ),
    },
    {
      cabecera: "Conductor",
      render: (v) => (
        <div>
          <p className="font-bold text-zinc-950 dark:text-white whitespace-nowrap">
            {v.conductor_display}
          </p>
          <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">{v.patente}</p>
        </div>
      ),
    },
    {
      cabecera: "Origen",
      render: (v) => (
        <span className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-2">
          {v.origen_direccion ?? "—"}
        </span>
      ),
    },
    {
      cabecera: "Destino",
      render: (v) => (
        <span className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-2">
          {v.destino_direccion ?? "—"}
        </span>
      ),
    },
    {
      cabecera: "Pasajero",
      render: (v) => (
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {v.pasajero_nombre ?? "—"}
        </span>
      ),
    },
    {
      cabecera: "Monto",
      render: (v) => (
        <span className="font-extrabold text-zinc-950 dark:text-brand whitespace-nowrap">
          {v.monto_display}
        </span>
      ),
    },
    {
      cabecera: "Estado",
      render: (v) => <BadgeEstadoViaje estado={v.estado_actual} />,
    },
    {
      // ── "Ver Detalles" action column ──
      cabecera: "Detalle",
      render: (v) => (
        <VerDetallesButton onClick={() => setViajeSeleccionado(v)} id={v.id_viaje} />
      ),
    },
  ];

  // ── Custom mobile card renderer ───────────────────────────────────────────────
  // Surfaces the action button at the top and groups the most useful fields.
  const mobileRender = (v: ViajeSerializado) => (
    <>
      {/* ── Top row: date + badge + action ── */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="font-mono text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
            {v.fecha_display}
          </span>
          <BadgeEstadoViaje estado={v.estado_actual} />
        </div>
        {/* Eye button — prominent, always top-right */}
        <VerDetallesButton onClick={() => setViajeSeleccionado(v)} id={v.id_viaje} prominent />
      </div>

      {/* ── Divider ── */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 my-2" />

      {/* ── Conductor + amount ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-extrabold text-sm text-zinc-950 dark:text-white truncate">
            {v.conductor_display}
          </p>
          <p className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">{v.patente}</p>
        </div>
        <span className="font-extrabold text-base text-zinc-950 dark:text-brand whitespace-nowrap shrink-0">
          {v.monto_display}
        </span>
      </div>

      {/* ── Pasajero ── */}
      {v.pasajero_nombre && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          <span className="font-bold uppercase tracking-wide">Pasajero: </span>
          {v.pasajero_nombre}
        </p>
      )}

      {/* ── Route (collapsed, 1 line each) ── */}
      <div className="mt-2 space-y-1">
        <div className="flex items-start gap-1.5">
          <MapPin className="w-3 h-3 mt-0.5 text-brand shrink-0" strokeWidth={2.5} />
          <span className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-1">
            {v.origen_direccion ?? "—"}
          </span>
        </div>
        <div className="flex items-start gap-1.5">
          <Flag className="w-3 h-3 mt-0.5 text-alert shrink-0" strokeWidth={2.5} />
          <span className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-1">
            {v.destino_direccion ?? "—"}
          </span>
        </div>
      </div>
    </>
  );

  return (
    <>
      <AdminTabla<ViajeSerializado>
        columnas={columnas}
        filas={viajes}
        keyExtractor={(v) => v.id_viaje}
        mensajeVacio="No hay viajes registrados aún."
        mobileRender={mobileRender}
      />

      <ViajeDetalleModal viaje={viajeSeleccionado} onClose={handleClose} />
    </>
  );
}

// ─── Shared button sub-component ──────────────────────────────────────────────

function VerDetallesButton({
  onClick,
  id,
  prominent = false,
}: {
  onClick: () => void;
  id: string;
  prominent?: boolean;
}) {
  if (prominent) {
    return (
      <button
        aria-label={`Ver detalles del viaje ${id}`}
        onClick={onClick}
        className="flex items-center gap-1.5 px-3 py-2
          rounded-xl border-2 border-zinc-950 dark:border-zinc-600
          bg-zinc-950 dark:bg-zinc-700
          shadow-[3px_3px_0px_0px_#52525b] dark:shadow-none
          hover:bg-zinc-800 dark:hover:bg-zinc-600
          active:translate-y-0.5 active:shadow-none
          transition-all duration-150
          focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white
          shrink-0"
      >
        <Eye className="w-4 h-4 text-white" strokeWidth={2.5} />
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-white">
          Ver detalles
        </span>
      </button>
    );
  }

  return (
    <button
      aria-label={`Ver detalles del viaje ${id}`}
      onClick={onClick}
      className="group flex items-center gap-1.5 px-2.5 py-1.5
        rounded-lg border-2 border-zinc-950 dark:border-zinc-600
        bg-white dark:bg-zinc-800
        shadow-[2px_2px_0px_0px_#09090b] dark:shadow-none
        hover:bg-zinc-950 dark:hover:bg-zinc-700
        hover:-translate-y-0.5 active:translate-y-0 active:shadow-none
        transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white"
    >
      <Eye
        className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300 group-hover:text-white dark:group-hover:text-white transition-colors duration-150"
        strokeWidth={2.5}
      />
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-700 dark:text-zinc-300 group-hover:text-white dark:group-hover:text-white transition-colors duration-150 hidden sm:inline">
        Ver
      </span>
    </button>
  );
}
