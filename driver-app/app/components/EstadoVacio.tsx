// app/components/EstadoVacio.tsx
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icono: LucideIcon;
  titulo: string;
  descripcion?: string;
}

export default function EstadoVacio({ icono: Icon, titulo, descripcion }: EmptyStateProps) {
  return (
    <div className="rounded-card border border-dashed border-[rgba(220,38,38,0.2)] bg-[#0A0A0A] p-10 flex flex-col items-center justify-center text-center">
      <Icon className="w-12 h-12 mb-3 text-[#9CA3AF]" strokeWidth={2} aria-hidden="true" />
      <p className="font-bold text-lg text-white uppercase tracking-wider">{titulo}</p>
      {descripcion && <p className="text-sm mt-1 text-[#9CA3AF]">{descripcion}</p>}
    </div>
  );
}