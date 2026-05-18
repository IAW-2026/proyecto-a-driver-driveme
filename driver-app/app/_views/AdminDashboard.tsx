/**
 * app/_views/AdminDashboard.tsx
 * Server Component — Vista del panel de control para el rol ADMIN.
 */
import ThemeToggle from "@/app/components/ThemeToggle";

export default function AdminDashboard() {
  return (
    <section className="w-full max-w-5xl mx-auto rounded-2xl border-2 border-zinc-950 bg-white dark:border-white dark:bg-zinc-900 shadow-[6px_6px_0px_0px_#09090b] dark:shadow-[6px_6px_0px_0px_#ffffff] overflow-hidden">
      <div
        className="flex justify-between items-center p-4 md:p-6 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Panel de Control de Flota
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Bienvenido al centro de mando. Aquí verás las métricas globales.
          </p>
        </div>
        <ThemeToggle />
      </div>

      <div className="p-8 text-center" style={{ color: "var(--muted)" }}>
        {/* Placeholder — métricas globales en una etapa futura */}
        <p className="text-5xl mb-4">📊</p>
        <p className="text-lg font-medium" style={{ color: "var(--foreground)" }}>
          Módulo de administración
        </p>
        <p className="text-sm mt-2">Los gráficos y reportes de flota estarán disponibles próximamente.</p>
      </div>
    </section>
  );
}
