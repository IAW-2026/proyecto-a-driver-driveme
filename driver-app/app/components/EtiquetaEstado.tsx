// app/components/StatusBadge.tsx

interface StatusBadgeProps {
  estado: string;
  size?: "sm" | "md";
}

export default function StatusBadge({ estado, size = "md" }: StatusBadgeProps) {
  // Ahora el diccionario devuelve un string con las clases de Tailwind
  const colorMap: Record<string, string> = {
    // Estados de Viajes
    FINALIZADO: "bg-green-500 text-white border-green-500",
    EN_CURSO: "bg-brand text-zinc-950 border-zinc-950",
    CANCELADO_POR_CONDUCTOR: "bg-info text-white border-info",
    CANCELADO: "bg-alert text-white border-alert",

    // Estados de Billetera
    LIQUIDADO: "bg-brand text-zinc-950 border-zinc-950",
    PENDIENTE: "bg-alert text-white border-zinc-950",
  };

  // Clases por defecto si llega un estado desconocido
  const defaultClasses = "bg-zinc-200 text-zinc-800 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700";
  const colorClasses = colorMap[estado] ?? defaultClasses;

  const isBrand = estado === "EN_CURSO" || estado === "LIQUIDADO";

  const sizeClasses = size === "sm"
    ? "px-2 py-0.5 text-[10px]"
    : "w-full md:w-auto px-4 py-2 text-xs";

  return (
    <span
      className={`
        inline-flex items-center justify-center rounded-full border-2 
        uppercase tracking-[0.22em] transition-transform duration-200 
        shadow-[4px_4px_0px_0px_#09090b] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#09090b] 
        dark:shadow-[4px_4px_0px_0px_#CFFF04] dark:hover:-translate-y-1 dark:hover:shadow-[6px_6px_0px_0px_#CFFF04]
        ${isBrand ? "font-bold" : "font-semibold"} 
        ${sizeClasses} 
        ${colorClasses}
      `}
    >
      {estado.replace(/_/g, ' ')}
    </span>
  );
}