// app/components/EstadoVacio.tsx
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icono: LucideIcon;
  titulo: string;
  descripcion?: string;
}

export default function EstadoVacio({ icono: Icon, titulo, descripcion }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-zinc-400 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900/50 p-10 flex flex-col items-center justify-center text-center">
      <Icon className="w-12 h-12 mb-3 text-zinc-400 dark:text-zinc-600" strokeWidth={2} />
      <p className="font-bold text-lg text-zinc-950 dark:text-white uppercase tracking-wider">{titulo}</p>
      {descripcion && <p className="text-sm mt-1 text-zinc-500">{descripcion}</p>}
    </div>
  );
}