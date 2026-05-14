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
      text: "var(--text-inverted)",
      border: "var(--accent)",
    },
    CANCELADO_POR_CONDUCTOR: {
      background: "#FF6B6B",
      text: "#FFFFFF",
      border: "#FF4C4C",
    },
    CANCELADO: {
      background: "#FF6B6B",
      text: "#FFFFFF",
      border: "#FF4C4C",
    },
  };

  const badgeColors = colorMap[estado] ?? {
    background: "var(--surface-muted)",
    text: "var(--foreground)",
    border: "var(--border)",
  };

  return (
    <span
      className="px-3 py-1 text-xs font-semibold rounded-full border"
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