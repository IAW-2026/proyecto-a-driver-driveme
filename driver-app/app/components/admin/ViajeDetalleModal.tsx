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
    bg: "bg-[rgba(5,150,105,0.1)] border-[rgba(5,150,105,0.4)] shadow-[0_0_10px_rgba(5,150,105,0.2)]",
    text: "text-[#10B981]",
    label: "Completado",
  },
  EN_CURSO: {
    bg: "bg-[rgba(59,130,246,0.1)] border-[rgba(59,130,246,0.4)] shadow-[0_0_10px_rgba(59,130,246,0.2)]",
    text: "text-info",
    label: "En Curso",
  },
  ACEPTADO: {
    bg: "bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)]",
    text: "text-[#9CA3AF]",
    label: "Asignado",
  },
  CANCELADO_POR_CONDUCTOR: {
    bg: "bg-[rgba(220,38,38,0.1)] border-[rgba(220,38,38,0.4)] shadow-[0_0_10px_rgba(220,38,38,0.2)]",
    text: "text-primary",
    label: "Abortado",
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
      <Icon className="w-4 h-4 text-[#4B5563] shrink-0" strokeWidth={2.5} />
      <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#6B7280]">
        {label}
      </span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4 py-3 border-b border-[rgba(255,255,255,0.06)] last:border-b-0">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] shrink-0 sm:w-36">
        {label}
      </span>
      <span className="text-sm font-semibold text-white break-words sm:text-right">
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
  accent: "primary" | "info" | "success" | "zinc";
}) {
  const accentMap = {
    primary: "text-primary border-[rgba(220,38,38,0.3)] bg-[rgba(220,38,38,0.1)] shadow-[0_0_10px_rgba(220,38,38,0.2)]",
    info: "text-info border-[rgba(59,130,246,0.3)] bg-[rgba(59,130,246,0.1)] shadow-[0_0_10px_rgba(59,130,246,0.2)]",
    success: "text-[#10B981] border-[rgba(5,150,105,0.3)] bg-[rgba(5,150,105,0.1)] shadow-[0_0_10px_rgba(5,150,105,0.2)]",
    zinc: "text-[#6B7280] border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)]",
  };

  return (
    <div className="flex items-start gap-4">
      <div
        className={`mt-1 w-8 h-8 rounded-sharp border flex items-center justify-center shrink-0 ${accentMap[accent]}`}
      >
        <Icon className="w-4 h-4" strokeWidth={2.5} />
      </div>
      <div className="flex flex-col min-w-0 pt-0.5">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#9CA3AF]">
          {label}
        </span>
        <span className="text-sm font-semibold text-white break-words mt-0.5">
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
      aria-label={`Detalles de la Misión ${shortId(viaje.id_viaje)}`}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4
        bg-[#000]/80 backdrop-blur-md
        animate-in fade-in duration-200"
    >
      {/* ── Panel ── */}
      <div
        className="relative w-[95%] md:max-w-2xl max-h-[85vh]
          flex flex-col
          bg-[rgba(20,20,20,0.95)] backdrop-blur-xl
          border border-[rgba(220,38,38,0.2)]
          rounded-modal
          shadow-[0_0_40px_rgba(220,38,38,0.15)]
          overflow-hidden
          animate-in zoom-in-95 fade-in duration-200"
      >
        {/* ══ Header ════════════════════════════════════════════════════ */}
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-[rgba(220,38,38,0.2)] bg-[#0A0A0A] shrink-0">
          <div className="flex flex-col gap-2 min-w-0">
            {/* ID Row */}
            <div className="flex items-center gap-2 flex-wrap">
              <Hash className="w-4 h-4 text-primary shrink-0" strokeWidth={3} />
              <span className="font-mono text-xs font-bold text-white break-all tracking-widest uppercase">
                {viaje.id_viaje}
              </span>
            </div>
            {/* Status + date */}
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-sharp border text-[9px] font-extrabold uppercase tracking-[0.2em] ${estadoStyle.bg} ${estadoStyle.text}`}
              >
                {estadoStyle.label}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">
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
              rounded-sharp border border-[rgba(255,255,255,0.1)]
              bg-transparent text-[#9CA3AF]
              hover:bg-[rgba(239,68,68,0.1)] hover:border-[rgba(239,68,68,0.3)] hover:text-[#EF4444]
              transition-all duration-150 focus:outline-none focus:border-primary"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* ══ Scrollable Body ═══════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6 pb-4">

          {/* ── 1. Conductor / Vehículo ─────────────────────────────── */}
          <section>
            <SectionTitle icon={User} label="Operador Asignado" />
            <div className="rounded-card border border-[rgba(255,255,255,0.06)] bg-[#141414] px-5 py-1">
              <InfoRow
                label="Nombre"
                value={<span className="uppercase text-xs tracking-wider">{viaje.conductor_apellido}, {viaje.conductor_nombre}</span>}
              />
              <InfoRow label="Unidad" value={<span className="font-mono text-primary tracking-widest">{viaje.patente}</span>} />
            </div>
          </section>

          {/* ── 2. Passenger Info ────────────────────────────────────── */}
          <section>
            <SectionTitle icon={User} label="Sujeto" />
            <div className="rounded-card border border-[rgba(255,255,255,0.06)] bg-[#141414] px-5 py-1">
              <InfoRow label="Nombre" value={<span className="uppercase text-xs tracking-wider">{viaje.pasajero_nombre ?? "—"}</span>} />
              <InfoRow
                label="ID de Enlace"
                value={
                  viaje.id_pasajero ? (
                    <span className="font-mono text-[10px] text-[#9CA3AF] tracking-widest">{viaje.id_pasajero}</span>
                  ) : (
                    "—"
                  )
                }
              />
            </div>
          </section>

          {/* ── 3. Route Details ─────────────────────────────────────── */}
          <section>
            <SectionTitle icon={Navigation} label="Coordenadas" />
            <div className="rounded-card border border-[rgba(255,255,255,0.06)] bg-[#141414] px-5 py-1">
              <InfoRow
                label="Origen"
                value={
                  <span className="flex items-start gap-2 justify-end">
                    <MapPin className="w-3.5 h-3.5 mt-1 text-primary shrink-0" strokeWidth={2.5} />
                    <span>{viaje.origen_direccion ?? "—"}</span>
                  </span>
                }
              />
              <InfoRow
                label="Destino"
                value={
                  <span className="flex items-start gap-2 justify-end">
                    <Flag className="w-3.5 h-3.5 mt-1 text-[#EF4444] shrink-0" strokeWidth={2.5} />
                    <span>{viaje.destino_direccion ?? "—"}</span>
                  </span>
                }
              />
            </div>
          </section>

          {/* ── 4. Financials ────────────────────────────────────────── */}
          <section>
            <SectionTitle icon={CreditCard} label="Estado Financiero" />
            <div className="rounded-card border border-[rgba(255,255,255,0.06)] bg-[#141414] px-5 py-1">
              <InfoRow label="Estimación Inicial" value={formatARS(viaje.precio)} />
              <InfoRow
                label="Valor Ejecutado"
                value={
                  <span className="font-black text-lg text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">
                    {formatARS(montoFinal)}
                  </span>
                }
              />
              <InfoRow
                label="Canal de Pago"
                value={
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-sharp border text-[9px] font-extrabold uppercase tracking-widest
                    ${viaje.metodo_pago === "MERCADO_PAGO" ? "bg-[rgba(59,130,246,0.1)] border-info/50 text-info" : "bg-[rgba(220,38,38,0.1)] border-primary/50 text-primary"}`}
                  >
                    {viaje.metodo_pago === "MERCADO_PAGO" ? "MERCADO PAGO" : "EFECTIVO"}
                  </span>
                }
              />
            </div>
          </section>

          {/* ── 5. Timeline ──────────────────────────────────────────── */}
          <section>
            <SectionTitle icon={Clock} label="Registro Temporal" />
            <div className="rounded-card border border-[rgba(255,255,255,0.06)] bg-[#141414] p-5 space-y-5">
              <TimelineRow
                icon={CheckCircle2}
                label="Asignación de Misión"
                value={formatFecha(viaje.tiempo_aceptado)}
                accent="zinc"
              />
              <TimelineRow
                icon={Play}
                label="Inicio de Traslado"
                value={viaje.tiempo_comienzo ? formatFecha(viaje.tiempo_comienzo) : "—"}
                accent="info"
              />
              <TimelineRow
                icon={Flag}
                label="Misión Concluida"
                value={viaje.tiempo_completado ? formatFecha(viaje.tiempo_completado) : "—"}
                accent={viaje.tiempo_completado ? "success" : "zinc"}
              />
            </div>
          </section>
        </div>

        {/* ══ Footer ════════════════════════════════════════════════════ */}
        <div className="shrink-0 px-5 sm:px-6 py-4 border-t border-[rgba(220,38,38,0.2)] bg-[#0A0A0A] flex items-center justify-between gap-3">
          <span className="text-[10px] font-mono font-bold text-[#6B7280] uppercase tracking-widest truncate">
            REF: {shortId(viaje.id_viaje)}
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-sharp border border-[rgba(255,255,255,0.1)]
              bg-[#1F1F1F] text-[#9CA3AF]
              text-[10px] font-extrabold uppercase tracking-widest
              hover:text-white hover:border-[rgba(255,255,255,0.3)] hover:bg-[#2A2A2A]
              transition-all duration-150 focus:outline-none focus:border-primary"
          >
            Cerrar Modal
          </button>
        </div>
      </div>
    </div>
  );
}
