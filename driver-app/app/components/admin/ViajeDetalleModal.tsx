// app/components/admin/ViajeDetalleModal.tsx
"use client";

import { useEffect, useRef } from "react";
import {
  X,
  MapPin,
  User,
  CreditCard,
  Clock,
  Hash,
  Navigation,
  CheckCircle2,
  Play,
  Flag,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ViajeDetalle {
  id_viaje: string;
  estado_actual: string;
  creado_en: string; // ISO string — serialised from Server Component
  // Passenger
  pasajero_nombre: string | null;
  id_pasajero: string | null;
  // Route
  origen_direccion: string | null;
  destino_direccion: string | null;
  // Financials
  precio: number;
  precio_final: number;
  metodo_pago: string;
  // Timeline
  tiempo_aceptado: string; // ISO string
  tiempo_comienzo: string | null;
  tiempo_completado: string | null;
  // Conductor / Vehículo (for context)
  conductor_nombre: string;
  conductor_apellido: string;
  patente: string;
}

interface ViajeDetalleModalProps {
  viaje: ViajeDetalle | null;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ESTADO_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  FINALIZADO: {
    bg: "bg-brand dark:bg-zinc-900",
    text: "text-zinc-950 dark:text-brand",
    label: "Finalizado",
  },
  EN_CURSO: {
    bg: "bg-info dark:bg-zinc-900",
    text: "text-white dark:text-info",
    label: "En Curso",
  },
  ACEPTADO: {
    bg: "bg-zinc-200 dark:bg-zinc-800",
    text: "text-zinc-700 dark:text-zinc-300",
    label: "Aceptado",
  },
  CANCELADO_POR_CONDUCTOR: {
    bg: "bg-alert dark:bg-zinc-900",
    text: "text-white dark:text-alert",
    label: "Cancelado",
  },
};

function formatARS(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatFecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function shortId(id: string) {
  return id.split("-")[0].toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" strokeWidth={2.5} />
      <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-0.5 sm:gap-4 py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0">
      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 shrink-0 sm:w-36">
        {label}
      </span>
      <span className="text-sm font-semibold text-zinc-950 dark:text-white break-all sm:text-right">
        {value}
      </span>
    </div>
  );
}

function TimelineRow({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent: "brand" | "info" | "alert" | "zinc";
}) {
  const accentMap = {
    brand: "text-brand border-brand bg-brand/10 dark:bg-brand/5",
    info: "text-info border-info bg-info/10 dark:bg-info/5",
    alert: "text-alert border-alert bg-alert/10 dark:bg-alert/5",
    zinc: "text-zinc-400 border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/50",
  };

  return (
    <div className="flex items-start gap-3">
      <div
        className={`mt-0.5 w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0 ${accentMap[accent]}`}
      >
        <Icon className="w-4 h-4" strokeWidth={2.5} />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          {label}
        </span>
        <span className="text-sm font-semibold text-zinc-950 dark:text-white break-all">
          {value}
        </span>
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function ViajeDetalleModal({ viaje, onClose }: ViajeDetalleModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!viaje) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    // Prevent body scroll
    document.body.style.overflow = "hidden";
    // Focus close button for accessibility
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [viaje, onClose]);

  if (!viaje) return null;

  const estadoStyle = ESTADO_STYLES[viaje.estado_actual] ?? ESTADO_STYLES.ACEPTADO;
  const montoFinal = viaje.precio_final > 0 ? viaje.precio_final : viaje.precio;

  // Click outside overlay → close
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Detalles del viaje ${shortId(viaje.id_viaje)}`}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4
        bg-zinc-950/60 dark:bg-zinc-950/80 backdrop-blur-sm
        animate-in fade-in duration-200"
    >
      {/* ── Panel ── */}
      <div
        className="relative w-[95%] md:max-w-2xl max-h-[85vh]
          flex flex-col
          bg-white dark:bg-zinc-900
          border-4 border-zinc-950 dark:border-zinc-600
          rounded-2xl
          shadow-[6px_6px_0px_0px_#09090b]
          dark:shadow-none
          overflow-hidden
          animate-in zoom-in-95 fade-in duration-200"
      >
        {/* ══ Header ════════════════════════════════════════════════════ */}
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b-2 border-zinc-950 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 shrink-0">
          <div className="flex flex-col gap-1.5 min-w-0">
            {/* ID Row */}
            <div className="flex items-center gap-2 flex-wrap">
              <Hash className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" strokeWidth={3} />
              <span className="font-mono text-xs font-bold text-zinc-400 dark:text-zinc-500 break-all">
                {viaje.id_viaje}
              </span>
            </div>
            {/* Status + date */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-lg border-2 border-zinc-950 dark:border-zinc-600 text-[10px] font-extrabold uppercase tracking-widest shadow-[2px_2px_0px_0px_#09090b] dark:shadow-none ${estadoStyle.bg} ${estadoStyle.text}`}
              >
                {estadoStyle.label}
              </span>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {formatFecha(viaje.creado_en)}
              </span>
            </div>
          </div>

          {/* Close button */}
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Cerrar modal"
            className="ml-auto shrink-0 w-9 h-9 flex items-center justify-center
              rounded-xl border-2 border-zinc-950 dark:border-zinc-600
              bg-white dark:bg-zinc-800
              shadow-[2px_2px_0px_0px_#09090b] dark:shadow-none
              hover:bg-zinc-100 dark:hover:bg-zinc-700
              hover:-translate-y-0.5 active:translate-y-0 active:shadow-none
              transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white"
          >
            <X className="w-4 h-4 text-zinc-950 dark:text-white" strokeWidth={3} />
          </button>
        </div>

        {/* ══ Scrollable Body ═══════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5 pb-2">

          {/* ── 1. Conductor / Vehículo ─────────────────────────────── */}
          <section>
            <SectionTitle icon={User} label="Conductor & Vehículo" />
            <div className="rounded-xl border-2 border-zinc-950 dark:border-zinc-700 bg-white dark:bg-zinc-800/40 shadow-[3px_3px_0px_0px_#09090b] dark:shadow-none px-4 py-1">
              <InfoRow
                label="Conductor"
                value={`${viaje.conductor_apellido}, ${viaje.conductor_nombre}`}
              />
              <InfoRow label="Patente" value={<span className="font-mono">{viaje.patente}</span>} />
            </div>
          </section>

          {/* ── 2. Passenger Info ────────────────────────────────────── */}
          <section>
            <SectionTitle icon={User} label="Pasajero" />
            <div className="rounded-xl border-2 border-zinc-950 dark:border-zinc-700 bg-white dark:bg-zinc-800/40 shadow-[3px_3px_0px_0px_#09090b] dark:shadow-none px-4 py-1">
              <InfoRow label="Nombre" value={viaje.pasajero_nombre ?? "—"} />
              <InfoRow
                label="ID Pasajero"
                value={
                  viaje.id_pasajero ? (
                    <span className="font-mono text-xs">{viaje.id_pasajero}</span>
                  ) : (
                    "—"
                  )
                }
              />
            </div>
          </section>

          {/* ── 3. Route Details ─────────────────────────────────────── */}
          <section>
            <SectionTitle icon={Navigation} label="Ruta" />
            <div className="rounded-xl border-2 border-zinc-950 dark:border-zinc-700 bg-white dark:bg-zinc-800/40 shadow-[3px_3px_0px_0px_#09090b] dark:shadow-none px-4 py-1">
              <InfoRow
                label="Origen"
                value={
                  <span className="flex items-start gap-1.5 justify-end">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 text-brand shrink-0" strokeWidth={2.5} />
                    <span>{viaje.origen_direccion ?? "—"}</span>
                  </span>
                }
              />
              <InfoRow
                label="Destino"
                value={
                  <span className="flex items-start gap-1.5 justify-end">
                    <Flag className="w-3.5 h-3.5 mt-0.5 text-alert shrink-0" strokeWidth={2.5} />
                    <span>{viaje.destino_direccion ?? "—"}</span>
                  </span>
                }
              />
            </div>
          </section>

          {/* ── 4. Financials ────────────────────────────────────────── */}
          <section>
            <SectionTitle icon={CreditCard} label="Financiero" />
            <div className="rounded-xl border-2 border-zinc-950 dark:border-zinc-700 bg-white dark:bg-zinc-800/40 shadow-[3px_3px_0px_0px_#09090b] dark:shadow-none px-4 py-1">
              <InfoRow label="Precio Original" value={formatARS(viaje.precio)} />
              <InfoRow
                label="Precio Final"
                value={
                  <span className="font-extrabold text-base text-zinc-950 dark:text-brand">
                    {formatARS(montoFinal)}
                  </span>
                }
              />
              <InfoRow
                label="Método de Pago"
                value={
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md border-2 border-zinc-950 dark:border-zinc-600 text-[10px] font-extrabold uppercase tracking-widest shadow-[1px_1px_0px_0px_#09090b] dark:shadow-none
                    ${viaje.metodo_pago === "MERCADO_PAGO" ? "bg-info/20 text-info dark:text-info" : "bg-brand/20 text-zinc-950 dark:text-brand"}`}
                  >
                    {viaje.metodo_pago === "MERCADO_PAGO" ? "Mercado Pago" : "Efectivo"}
                  </span>
                }
              />
            </div>
          </section>

          {/* ── 5. Timeline ──────────────────────────────────────────── */}
          <section>
            <SectionTitle icon={Clock} label="Línea de Tiempo" />
            <div className="rounded-xl border-2 border-zinc-950 dark:border-zinc-700 bg-white dark:bg-zinc-800/40 shadow-[3px_3px_0px_0px_#09090b] dark:shadow-none p-4 space-y-4">
              <TimelineRow
                icon={CheckCircle2}
                label="Aceptado"
                value={formatFecha(viaje.tiempo_aceptado)}
                accent="zinc"
              />
              <TimelineRow
                icon={Play}
                label="Inicio del viaje"
                value={viaje.tiempo_comienzo ? formatFecha(viaje.tiempo_comienzo) : "—"}
                accent="info"
              />
              <TimelineRow
                icon={Flag}
                label="Completado"
                value={viaje.tiempo_completado ? formatFecha(viaje.tiempo_completado) : "—"}
                accent={viaje.tiempo_completado ? "brand" : "zinc"}
              />
            </div>
          </section>
        </div>

        {/* ══ Footer ════════════════════════════════════════════════════ */}
        <div className="shrink-0 px-5 sm:px-6 py-4 border-t-2 border-zinc-950 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between gap-3">
          <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 truncate">
            ID: {viaje.id_viaje}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl border-2 border-zinc-950 dark:border-zinc-600
              bg-zinc-950 dark:bg-white
              text-white dark:text-zinc-950
              text-xs font-extrabold uppercase tracking-widest
              shadow-[3px_3px_0px_0px_#52525b] dark:shadow-none
              hover:bg-zinc-800 dark:hover:bg-zinc-100
              hover:-translate-y-0.5 active:translate-y-0 active:shadow-none
              transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
