// app/components/EtiquetaEstado.tsx

interface StatusBadgeProps {
  estado: string;
  size?: "sm" | "md";
}

export default function StatusBadge({ estado, size = "md" }: StatusBadgeProps) {
  const colorMap: Record<string, string> = {
    // Estados de Viajes
    FINALIZADO: "bg-[rgba(5,150,105,0.15)] text-[#34D399] border-[#059669]/50 shadow-[0_0_10px_rgba(5,150,105,0.1)]",
    EN_CURSO: "bg-[rgba(220,38,38,0.15)] text-[#F87171] border-primary/50 shadow-[0_0_10px_rgba(220,38,38,0.1)]",
    CANCELADO_POR_CONDUCTOR: "bg-[rgba(217,119,6,0.15)] text-[#FBBF24] border-[#D97706]/50 shadow-[0_0_10px_rgba(217,119,6,0.1)]",
    CANCELADO: "bg-[rgba(239,68,68,0.15)] text-[#F87171] border-[#EF4444]/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]",

    // Estados de Billetera
    LIQUIDADO: "bg-[rgba(5,150,105,0.15)] text-[#34D399] border-[#059669]/50 shadow-[0_0_10px_rgba(5,150,105,0.1)]",
    PENDIENTE: "bg-[rgba(217,119,6,0.15)] text-[#FBBF24] border-[#D97706]/50 shadow-[0_0_10px_rgba(217,119,6,0.1)]",
  };

  const defaultClasses = "bg-[#1F1F1F] text-[#9CA3AF] border-[rgba(255,255,255,0.1)]";
  const colorClasses = colorMap[estado] ?? defaultClasses;

  const sizeClasses = size === "sm"
    ? "px-2 py-0.5 text-[10px]"
    : "w-full md:w-auto px-4 py-2 text-xs";

  return (
    <span
      className={`
        inline-flex items-center justify-center rounded-sharp border
        uppercase tracking-[0.2em] font-bold
        ${sizeClasses} 
        ${colorClasses}
      `}
    >
      {estado.replace(/_/g, ' ')}
    </span>
  );
}