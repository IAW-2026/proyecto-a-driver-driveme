// app/components/admin/AdminMetricaCard.tsx
import React from "react";

interface AdminMetricaCardProps {
  label: string;
  valor: string | number;
  icono: React.ReactNode;
  /** Tailwind color classes for the card accent (border + shadow) */
  acento?: "brand" | "alert" | "info";
}

const acentoStyles: Record<NonNullable<AdminMetricaCardProps["acento"]>, string> = {
  brand:
    "border-zinc-950 bg-brand text-zinc-950 shadow-[3px_3px_0px_0px_#09090b] dark:border-brand dark:bg-zinc-900 dark:text-brand dark:shadow-[3px_3px_0px_0px_#CFFF04]",
  alert:
    "border-zinc-950 bg-alert text-zinc-950 shadow-[3px_3px_0px_0px_#09090b] dark:border-alert dark:bg-zinc-900 dark:text-alert dark:shadow-[3px_3px_0px_0px_#FF007F]",
  info: "border-zinc-950 bg-info text-zinc-950 shadow-[3px_3px_0px_0px_#09090b] dark:border-info dark:bg-zinc-900 dark:text-info dark:shadow-[3px_3px_0px_0px_#8B5CF6]",
};

/**
 * AdminMetricaCard — Tarjeta de métrica neobrutalista reutilizable para el panel de admin.
 */
export default function AdminMetricaCard({
  label,
  valor,
  icono,
  acento = "brand",
}: AdminMetricaCardProps) {
  return (
    <div
      className={`rounded-2xl border-2 p-5 flex flex-col justify-between min-h-30 transition-transform duration-200 md:hover:-translate-y-1 ${acentoStyles[acento]}`}
    >
      <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-zinc-950 dark:text-zinc-100">
        {label}
      </span>
      <div className="flex justify-between items-end mt-3">
        <span className="text-4xl font-black tabular-nums leading-none">
          {valor}
        </span>
        <span aria-hidden="true">{icono}</span>
      </div>
    </div>
  );
}
