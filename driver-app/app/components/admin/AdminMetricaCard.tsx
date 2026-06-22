// app/components/admin/AdminMetricaCard.tsx
import React from "react";

interface AdminMetricaCardProps {
  label: string;
  valor: string | number;
  icono: React.ReactNode;
  acento?: "primary" | "error" | "info" | "success" | "warning";
}

const acentoStyles: Record<NonNullable<AdminMetricaCardProps["acento"]>, string> = {
  primary:
    "border-[rgba(220,38,38,0.4)] shadow-[0_0_15px_rgba(220,38,38,0.15)] text-primary",
  error:
    "border-[rgba(239,68,68,0.4)] shadow-[0_0_15px_rgba(239,68,68,0.15)] text-[#EF4444]",
  info:
    "border-[rgba(59,130,246,0.4)] shadow-[0_0_15px_rgba(59,130,246,0.15)] text-[#3B82F6]",
  success:
    "border-[rgba(5,150,105,0.4)] shadow-[0_0_15px_rgba(5,150,105,0.15)] text-[#059669]",
  warning:
    "border-[rgba(217,119,6,0.4)] shadow-[0_0_15px_rgba(217,119,6,0.15)] text-[#D97706]",
};

/**
 * AdminMetricaCard — Tarjeta de métrica Dark Sci-Fi para el panel de admin.
 */
export default function AdminMetricaCard({
  label,
  valor,
  icono,
  acento = "primary",
}: AdminMetricaCardProps) {
  return (
    <div
      className={`rounded-card border bg-[rgba(20,20,20,0.8)] backdrop-blur-sm p-5 flex flex-col justify-between min-h-30 transition-transform duration-200 md:hover:translate-y-[-2px] ${acentoStyles[acento]}`}
    >
      <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#9CA3AF]">
        {label}
      </span>
      <div className="flex justify-between items-end mt-3">
        <span className="text-4xl font-black tabular-nums leading-none text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
          {valor}
        </span>
        <span aria-hidden="true" className={acentoStyles[acento].split(" ").pop()}>{icono}</span>
      </div>
    </div>
  );
}
