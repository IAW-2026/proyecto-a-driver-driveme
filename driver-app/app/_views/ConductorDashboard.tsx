/**
 * app/_views/ConductorDashboard.tsx
 * Server Component — Wrapper del dashboard para el conductor activo.
 * Renderiza el mapa placeholder + PanelConductor (Client).
 */
import ThemeToggle from "@/app/components/ThemeToggle";
import PanelConductor from "@/app/components/PanelConductor";
import { ConductorConVehiculos } from "@/lib/getSessionData";

interface ConductorDashboardProps {
  conductorData: ConductorConVehiculos;
}

export default function ConductorDashboard({ conductorData }: ConductorDashboardProps) {
  const vehiculo = conductorData.vehiculos[0];

  return (
    <section
      className="w-full max-w-5xl mx-auto rounded-2xl shadow-lg border overflow-hidden"
      style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <div
        className="flex justify-between items-center px-4 py-3 md:px-6 md:py-4 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div>
          <h1 className="text-base md:text-lg font-extrabold tracking-widest uppercase" style={{ color: "var(--foreground)" }}>
            DriveMe — Dashboard
          </h1>
          {vehiculo && (
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              {vehiculo.marca} {vehiculo.modelo} · {vehiculo.patente}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Rating del conductor */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ backgroundColor: "var(--surface-muted)" }}>
            <span className="text-yellow-500 text-sm">★</span>
            <span className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
              {conductorData.calificacion_promedio.toFixed(1)}
            </span>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="p-4 md:p-8 space-y-4 md:space-y-6">
        {/* ── Placeholder del Mapa ─────────────────────────────── */}
        <div
          className="w-full h-48 md:h-80 rounded-xl border flex flex-col items-center justify-center relative overflow-hidden"
          style={{ backgroundColor: "var(--surface-muted)", borderColor: "var(--border)" }}
          role="img"
          aria-label="Mapa de ubicación del conductor (próximamente)"
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{ background: "radial-gradient(ellipse at center, var(--accent) 0%, transparent 70%)" }}
            aria-hidden
          />
          {/* Cuadrícula estilo mapa */}
          <svg className="absolute inset-0 w-full h-full opacity-10" aria-hidden>
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          <div className="z-10 text-center space-y-2">
            <span className="text-4xl" aria-hidden>📍</span>
            <p className="font-bold text-sm md:text-base" style={{ color: "var(--foreground)" }}>
              Mapa GPS
            </p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Leaflet · Disponible en próxima pantalla
            </p>
          </div>
        </div>

        {/* ── Panel del Conductor (Client Component) ───────────── */}
        <PanelConductor conductorData={conductorData} />
      </div>
    </section>
  );
}
