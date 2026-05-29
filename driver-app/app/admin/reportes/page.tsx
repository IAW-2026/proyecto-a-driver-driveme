/**
 * app/admin/reportes/page.tsx
 * Server Component — Listado de los últimos viajes de toda la flota.
 * Passes serialised data to ReportesClientLayout (client) for modal state.
 */
import { Metadata } from "next";
import { DollarSign } from "lucide-react";
import prisma from "@/lib/prisma";
import Sidebar from "@/app/components/Nav";
import HeaderModulo from "@/app/components/HeaderModulo";
import ThemeToggle from "@/app/components/ThemeToggle";
import AdminMetricaCard from "@/app/components/admin/AdminMetricaCard";
import ExportarPDF from "@/app/components/admin/ExportarPDF";
import type { ViajeParaPDF } from "@/app/components/admin/ExportarPDF";
import ReportesClientLayout, {
  type ViajeSerializado,
} from "@/app/components/admin/ReportesClientLayout";
import { formatARS, formatFecha } from "@/lib/formatters";
import { BarChart3, Route, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "DriveMe — Reportes de Viajes",
  description: "Historial y métricas de los últimos viajes realizados en DriveMe.",
};

const LIMITE_VIAJES = 50;

export default async function ReportesPage() {
  // ── Queries in parallel ──────────────────────────────────────────────────────
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

  // ── Serialise for client components ─────────────────────────────────────────
  // All Dates → ISO strings; Prisma objects → plain POJOs.

  const viajesSerializados: ViajeSerializado[] = viajes.map((v) => ({
    // IDs & status
    id_viaje: v.id_viaje,
    estado_actual: v.estado_actual,
    creado_en: v.creado_en.toISOString(),
    // Passenger
    pasajero_nombre: v.pasajero_nombre,
    id_pasajero: v.id_pasajero,
    // Route
    origen_direccion: v.origen_direccion,
    destino_direccion: v.destino_direccion,
    // Financials
    precio: v.precio,
    precio_final: v.precio_final,
    metodo_pago: v.metodo_pago,
    // Timeline (ISO strings)
    tiempo_aceptado: v.tiempo_aceptado.toISOString(),
    tiempo_comienzo: v.tiempo_comienzo ? v.tiempo_comienzo.toISOString() : null,
    tiempo_completado: v.tiempo_completado ? v.tiempo_completado.toISOString() : null,
    // Conductor / Vehículo
    conductor_nombre: v.conductor.nombre,
    conductor_apellido: v.conductor.apellido,
    patente: v.vehiculo.patente,
    // Pre-formatted display strings (computed server-side once)
    fecha_display: formatFecha(v.creado_en),
    monto_display: formatARS(v.precio_final > 0 ? v.precio_final : v.precio),
    conductor_display: `${v.conductor.apellido}, ${v.conductor.nombre}`,
  }));

  // ── PDF export data ──────────────────────────────────────────────────────────
  const viajesParaPDF: ViajeParaPDF[] = viajesSerializados.map((v) => ({
    id_viaje: v.id_viaje,
    fecha: v.fecha_display,
    conductor: v.conductor_display,
    patente: v.patente,
    origen: v.origen_direccion ?? "—",
    destino: v.destino_direccion ?? "—",
    pasajero: v.pasajero_nombre ?? "—",
    monto: v.monto_display,
    estado: v.estado_actual,
  }));

  const timestampReporte = formatFecha(new Date());

  // ── Metric cards ─────────────────────────────────────────────────────────────
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

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-white font-sans">
      <Sidebar rol="ADMIN" />

      <main className="flex-1 pt-8 pb-28 md:pb-8 md:pl-72 px-4 md:px-10">
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 overflow-hidden">
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

          {/* Tabla de viajes + Modal (client-side state) */}
          <div className="rounded-2xl border-2 border-zinc-950 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-[3px_3px_0px_0px_#09090b] dark:shadow-none overflow-hidden">
            <div className="px-5 py-4 border-b-2 border-zinc-950 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950">
              <p className="text-xs font-extrabold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Historial de viajes
              </p>
            </div>

            <div className="p-4 md:p-5">
              <ReportesClientLayout viajes={viajesSerializados} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
