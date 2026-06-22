/**
 * app/_views/AdminDashboard.tsx
 * Server Component — Panel de control del ADMIN con métricas globales reales.
 */
import { Users, CarFront, Route, Zap, BarChart3, LayoutDashboard } from "lucide-react";
import prisma from "@/lib/prisma";
import HeaderModulo from "@/app/components/HeaderModulo";
import SignOutButton from "@/app/components/SignOutButton";
import AdminMetricaCard from "@/app/components/admin/AdminMetricaCard";
import { formatARS } from "@/lib/formatters";

export default async function AdminDashboard() {
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
      icono: <Users className="w-8 h-8" strokeWidth={2} />,
      acento: "primary" as const,
    },
    {
      label: "Conductores Activos",
      valor: conductoresActivos.toString(),
      icono: <Zap className="w-8 h-8" strokeWidth={2} />,
      acento: "error" as const,
    },
    {
      label: "Vehículos en Flota",
      valor: totalVehiculos.toString(),
      icono: <CarFront className="w-8 h-8" strokeWidth={2} />,
      acento: "info" as const,
    },
    {
      label: "Viajes Totales",
      valor: totalViajes.toString(),
      icono: <Route className="w-8 h-8" strokeWidth={2} />,
      acento: "primary" as const,
    },
    {
      label: "Viajes Finalizados",
      valor: viajesFinalizados.toString(),
      icono: <BarChart3 className="w-8 h-8" strokeWidth={2} />,
      acento: "success" as const,
    },
    {
      label: "Recaudación Total",
      valor: formatARS(recaudacionTotal),
      icono: <BarChart3 className="w-8 h-8" strokeWidth={2} />,
      acento: "warning" as const,
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-28 md:pb-0">
      {/* Encabezado */}
      <HeaderModulo
        titulo="Dashboard"
        icono={LayoutDashboard}
        subtitulo="Centro de mando — métricas globales en tiempo real"
        acciones={<SignOutButton />}
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
      <div className="rounded-card border border-[rgba(220,38,38,0.15)] bg-[rgba(20,20,20,0.8)] backdrop-blur-sm shadow-[0_0_20px_rgba(220,38,38,0.04)] p-6">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-red-400 mb-4">
          Resumen Operativo
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 rounded-card border border-[rgba(255,255,255,0.06)] bg-[#0A0A0A]">
            <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-1">Tasa de finalización</p>
            <p className="text-2xl font-extrabold text-white">
              {totalViajes > 0
                ? `${Math.round((viajesFinalizados / totalViajes) * 100)}%`
                : "—"}
            </p>
          </div>
          <div className="p-3 rounded-card border border-[rgba(255,255,255,0.06)] bg-[#0A0A0A]">
            <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-1">Conductores online</p>
            <p className="text-2xl font-extrabold text-white">
              {totalConductores > 0
                ? `${conductoresActivos} / ${totalConductores}`
                : "—"}
            </p>
          </div>
          <div className="p-3 rounded-card border border-[rgba(255,255,255,0.06)] bg-[#0A0A0A]">
            <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-1">Recaudación promedio/viaje</p>
            <p className="text-2xl font-extrabold text-white">
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
