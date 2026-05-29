/**
 * app/admin/reportes/page.tsx
 * Server Component — Listado de los últimos viajes de toda la flota.
 */
import { Metadata } from "next";
import { DollarSign } from "lucide-react";
import prisma from "@/lib/prisma";
import Sidebar from "@/app/components/Sidebar";
import HeaderModulo from "@/app/components/HeaderModulo";
import ThemeToggle from "@/app/components/ThemeToggle";
import AdminTabla from "@/app/components/admin/AdminTabla";
import AdminMetricaCard from "@/app/components/admin/AdminMetricaCard";
import ExportarPDF from "@/app/components/admin/ExportarPDF";
import type { ViajeParaPDF } from "@/app/components/admin/ExportarPDF";
import { formatARS, formatFecha } from "@/lib/formatters";
import { Prisma } from "@/app/generated/prisma/client";
import { BarChart3, Route, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "DriveMe — Reportes de Viajes",
  description: "Historial y métricas de los últimos viajes realizados en DriveMe.",
};

// Tipo inferido con las relaciones necesarias
type ViajeConRelaciones = Prisma.ViajeGetPayload<{
  include: { conductor: true; vehiculo: true };
}>;

/** Badge del estado del viaje */
function BadgeEstadoViaje({ estado }: { estado: string }) {
  const estilos: Record<string, string> = {
    FINALIZADO:
      "bg-brand text-zinc-950 border-zinc-950 dark:border-brand dark:shadow-[2px_2px_0px_0px_#CFFF04]",
    EN_CURSO:
      "bg-info text-white border-zinc-950 dark:border-info dark:shadow-[2px_2px_0px_0px_#8B5CF6]",
    ACEPTADO:
      "bg-zinc-200 text-zinc-700 border-zinc-950 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-600",
    CANCELADO_POR_CONDUCTOR:
      "bg-alert text-white border-zinc-950 dark:border-alert dark:shadow-[2px_2px_0px_0px_#FF007F]",
  };

  const etiquetas: Record<string, string> = {
    FINALIZADO: "Finalizado",
    EN_CURSO: "En Curso",
    ACEPTADO: "Aceptado",
    CANCELADO_POR_CONDUCTOR: "Cancelado",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-lg border-2 text-[10px] font-extrabold uppercase tracking-widest shadow-[2px_2px_0px_0px_#09090b] ${estilos[estado] ?? estilos.ACEPTADO}`}
    >
      {etiquetas[estado] ?? estado}
    </span>
  );
}

const LIMITE_VIAJES = 50;

export default async function ReportesPage() {
  // Consultas en paralelo: últimos viajes + métricas del día de hoy
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const [viajes, viajesHoy, recaudacionHoy, conductoresActivos] = await Promise.all([
    prisma.viaje.findMany({
      take: LIMITE_VIAJES,
      orderBy: { creado_en: "desc" },
      include: { conductor: true, vehiculo: true },
    }),
    prisma.viaje.count({
      where: { creado_en: { gte: hoy } },
    }),
    prisma.viaje.aggregate({
      _sum: { precio_final: true },
      where: { estado_actual: "FINALIZADO", creado_en: { gte: hoy } },
    }),
    prisma.conductor.count({ where: { isActive: true, estado: "ONLINE" } }),
  ]);

  const recaudacionHoyTotal = recaudacionHoy._sum.precio_final ?? 0;

  // Serializar viajes para el Client Component de exportación.
  // Se mapea a un tipo plano para no pasar objetos Prisma al cliente.
  const viajesParaPDF: ViajeParaPDF[] = viajes.map((v) => ({
    id_viaje: v.id_viaje,
    fecha: formatFecha(v.creado_en),
    conductor: `${v.conductor.apellido}, ${v.conductor.nombre}`,
    patente: v.vehiculo.patente,
    origen: v.origen_direccion ?? "—",
    destino: v.destino_direccion ?? "—",
    pasajero: v.pasajero_nombre ?? "—",
    monto: formatARS(v.precio_final > 0 ? v.precio_final : v.precio),
    estado: v.estado_actual,
  }));

  const timestampReporte = formatFecha(new Date());

  const metricasHoy = [
    {
      label: "Viajes Hoy",
      valor: viajesHoy.toString(),
      icono: <Route className="w-8 h-8" strokeWidth={2.5} />,
      acento: "brand" as const,
    },
    {
      label: "Recaudación Hoy",
      valor: formatARS(recaudacionHoyTotal),
      icono: <BarChart3 className="w-8 h-8" strokeWidth={2.5} />,
      acento: "alert" as const,
    },
    {
      label: "Conductores Online",
      valor: conductoresActivos.toString(),
      icono: <Users className="w-8 h-8" strokeWidth={2.5} />,
      acento: "info" as const,
    },
  ];

  const columnas: Parameters<typeof AdminTabla<ViajeConRelaciones>>[0]["columnas"] = [
    {
      cabecera: "Fecha",
      render: (v) => (
        <span className="font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
          {formatFecha(v.creado_en)}
        </span>
      ),
    },
    {
      cabecera: "Conductor",
      render: (v) => (
        <div>
          <p className="font-bold text-zinc-950 dark:text-white whitespace-nowrap">
            {v.conductor.apellido}, {v.conductor.nombre}
          </p>
          <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
            {v.vehiculo.patente}
          </p>
        </div>
      ),
    },
    {
      cabecera: "Origen",
      render: (v) => (
        <span className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-2">
          {v.origen_direccion ?? "—"}
        </span>
      ),
    },
    {
      cabecera: "Destino",
      render: (v) => (
        <span className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-2">
          {v.destino_direccion ?? "—"}
        </span>
      ),
    },
    {
      cabecera: "Pasajero",
      render: (v) => (
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {v.pasajero_nombre ?? "—"}
        </span>
      ),
    },
    {
      cabecera: "Monto",
      render: (v) => {
        const monto = v.precio_final > 0 ? v.precio_final : v.precio;
        return (
          <span className="font-extrabold text-zinc-950 dark:text-brand whitespace-nowrap">
            {formatARS(monto)}
          </span>
        );
      },
    },
    {
      cabecera: "Estado",
      render: (v) => <BadgeEstadoViaje estado={v.estado_actual} />,
    },
  ];

  return (
    <div className="flex min-h-screen w-full bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-white font-sans">
      <Sidebar rol="ADMIN" />

      <main className="flex-1 pt-8 pb-24 md:pb-8 md:pl-72 px-4 md:px-10">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          {/* Encabezado */}
          <HeaderModulo
            titulo="Reportes"
            icono={DollarSign}
            subtitulo={`Últimos ${LIMITE_VIAJES} viajes registrados`}
            acciones={
              <>
                <ExportarPDF viajes={viajesParaPDF} timestamp={timestampReporte} />
                <ThemeToggle />
              </>
            }
          />

          {/* Métricas del día */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {metricasHoy.map(({ label, valor, icono, acento }) => (
              <AdminMetricaCard
                key={label}
                label={label}
                valor={valor}
                icono={icono}
                acento={acento}
              />
            ))}
          </div>

          {/* Tabla de viajes */}
          <div className="rounded-2xl border-2 border-zinc-950 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_#09090b] dark:shadow-none overflow-hidden">
            <div className="px-5 py-4 border-b-2 border-zinc-950 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950">
              <p className="text-xs font-extrabold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Historial de viajes
              </p>
            </div>

            <div className="p-4 md:p-5">
              <AdminTabla<ViajeConRelaciones>
                columnas={columnas}
                filas={viajes}
                keyExtractor={(v) => v.id_viaje}
                mensajeVacio="No hay viajes registrados aún."
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
