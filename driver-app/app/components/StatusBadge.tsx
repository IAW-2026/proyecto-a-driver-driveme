interface StatusBadgeProps {
  estado: string;
}

interface BadgeColors {
  background: string;
  text: string;
  border: string;
}

export default function StatusBadge({ estado }: StatusBadgeProps) {
  const colorMap: Record<string, BadgeColors> = {
    FINALIZADO: {
      background: "#32CD32",
      text: "#FFFFFF",
      border: "#32CD32",
    },
    EN_CURSO: {
      background: "var(--accent)",
      text: "#09090b",
      border: "var(--accent)",
    },
    CANCELADO_POR_CONDUCTOR: {
      background: "#8B5CF6",
      text: "#FFFFFF",
      border: "#7842f7",
    },
    CANCELADO: {
      background: "#ff349a",
      text: "#FFFFFF",
      border: "#FF007F",
    },
  };

  const badgeColors = colorMap[estado] ?? {
    background: "var(--surface-muted)",
    text: "var(--foreground)",
    border: "var(--border)",
  };

  const isBrand = estado === "EN_CURSO";

  return (
    <span
      className={`inline-flex w-full md:w-auto items-center justify-center rounded-full border-2 px-4 py-2 text-xs ${isBrand ? "font-bold" : "font-semibold"} uppercase tracking-[0.22em] transition-transform duration-200 shadow-[4px_4px_0px_0px_#09090b] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#09090b] dark:border-2 dark:border-brand dark:shadow-[4px_4px_0px_0px_#CFFF04] dark:hover:-translate-y-1 dark:hover:shadow-[6px_6px_0px_0px_#CFFF04]`}
      style={{
        backgroundColor: badgeColors.background,
        color: badgeColors.text,
        borderColor: badgeColors.border,
      }}
    >
      {estado.replace(/_/g, ' ')}
    </span>
  );
}