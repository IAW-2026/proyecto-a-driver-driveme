/**
 * app/_views/AdminDashboard.tsx
 * Server Component — Panel de control del ADMIN con métricas globales reales.
 */
import { Users, Car, Route, Zap, BarChart3, LayoutDashboard } from "lucide-react";
import prisma from "@/lib/prisma";
import HeaderModulo from "@/app/components/HeaderModulo";
import ThemeToggle from "@/app/components/ThemeToggle";
import AdminMetricaCard from "@/app/components/admin/AdminMetricaCard";
import { formatARS } from "@/lib/formatters";

export default async function AdminDashboard() {
  // ── Consultas en paralelo para minimizar latencia ──────────────────────────
  const [
    totalConductores,
    conductoresActivos,
    totalVehiculos,
    totalViajes,
    viajesFinalizados,
    recaudacionAgregada,
  ] = await Promise.all([
    prisma.conductor.count({ where: { isActive: true } }),
    prisma.conductor.count({ where: { isActive: true, estado: "ONLINE" } }),
    prisma.vehiculo.count({ where: { isActive: true } }),
    prisma.viaje.count(),
    prisma.viaje.count({ where: { estado_actual: "FINALIZADO" } }),
    prisma.viaje.aggregate({
      _sum: { precio_final: true },
      where: { estado_actual: "FINALIZADO" },
    }),
  ]);

  const recaudacionTotal = recaudacionAgregada._sum.precio_final ?? 0;

  const metricas = [
    {
      label: "Conductores Totales",
      valor: totalConductores.toString(),
      icono: <Users className="w-8 h-8" strokeWidth={2.5} />,
      acento: "brand" as const,
    },
    {
      label: "Conductores Activos",
      valor: conductoresActivos.toString(),
      icono: <Zap className="w-8 h-8" strokeWidth={2.5} />,
      acento: "alert" as const,
    },
    {
      label: "Vehículos en Flota",
      valor: totalVehiculos.toString(),
      icono: <Car className="w-8 h-8" strokeWidth={2.5} />,
      acento: "info" as const,
    },
    {
      label: "Viajes Totales",
      valor: totalViajes.toString(),
      icono: <Route className="w-8 h-8" strokeWidth={2.5} />,
      acento: "brand" as const,
    },
    {
      label: "Viajes Finalizados",
      valor: viajesFinalizados.toString(),
      icono: <BarChart3 className="w-8 h-8" strokeWidth={2.5} />,
      acento: "info" as const,
    },
    {
      label: "Recaudación Total",
      valor: formatARS(recaudacionTotal),
      icono: <BarChart3 className="w-8 h-8" strokeWidth={2.5} />,
      acento: "alert" as const,
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Encabezado */}
      <HeaderModulo
        titulo="Dashboard"
        icono={LayoutDashboard}
        subtitulo="Centro de mando — métricas globales en tiempo real"
        acciones={<ThemeToggle />}
      />

      {/* Grid de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricas.map(({ label, valor, icono, acento }) => (
          <AdminMetricaCard
            key={label}
            label={label}
            valor={valor}
            icono={icono}
            acento={acento}
          />
        ))}
      </div>

      {/* Resumen rápido */}
      <div className="rounded-2xl border-2 border-zinc-950 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_#09090b] dark:shadow-none p-6">
        <p className="text-xs font-extrabold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-3">
          Resumen Operativo
        </p>
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Tasa de finalización</p>
            <p className="text-2xl font-extrabold text-zinc-950 dark:text-white">
              {totalViajes > 0
                ? `${Math.round((viajesFinalizados / totalViajes) * 100)}%`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Conductores online</p>
            <p className="text-2xl font-extrabold text-zinc-950 dark:text-white">
              {totalConductores > 0
                ? `${conductoresActivos} / ${totalConductores}`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Recaudación promedio/viaje</p>
            <p className="text-2xl font-extrabold text-zinc-950 dark:text-white">
              {viajesFinalizados > 0
                ? formatARS(recaudacionTotal / viajesFinalizados)
                : "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
