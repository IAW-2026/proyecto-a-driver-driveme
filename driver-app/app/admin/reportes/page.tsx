/**
 * app/admin/reportes/page.tsx
 * Server Component — Listado paginado y filtrable de viajes de toda la flota.
 * Aplica filtros y paginación a nivel de base de datos mediante searchParams.
 *
 * Parámetros de URL soportados:
 *   ?query=   Busca por nombre de conductor o de pasajero
 *   ?estado=  FINALIZADO | EN_CURSO | ACEPTADO | CANCELADO_POR_CONDUCTOR
 *   ?page=    Número de página (default: 1)
 */
import { Suspense } from "react";
import { Metadata } from "next";
import { DollarSign, BarChart3, Route, Users } from "lucide-react";
import { Prisma, $Enums } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma";
import Sidebar from "@/app/components/Nav";
import HeaderModulo from "@/app/components/HeaderModulo";
import ThemeToggle from "@/app/components/ThemeToggle";
import SignOutButton from "@/app/components/SignOutButton";
import AdminMetricaCard from "@/app/components/admin/AdminMetricaCard";
import ExportarPDF from "@/app/components/admin/ExportarPDF";
import type { ViajeParaPDF } from "@/app/components/admin/ExportarPDF";
import ReportesClientLayout, {
  type ViajeSerializado,
} from "@/app/components/admin/ReportesClientLayout";
import { formatARS, formatFecha } from "@/lib/formatters";

export const metadata: Metadata = {
  title: "DriveMe — Reportes de Viajes",
  description:
    "Historial y métricas de los últimos viajes realizados en DriveMe.",
};

const PAGE_SIZE = 15;

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{
    query?: string;
    estado?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;

  const query = params.query?.trim() ?? "";
  const estado = params.estado ?? "";
  const paginaActual = Math.max(1, Number(params.page) || 1);
  const skip = (paginaActual - 1) * PAGE_SIZE;

  // ── Hoy (para métricas) ─────────────────────────────────────────────────────
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // ── Cláusula where para la tabla de viajes ──────────────────────────────────
  const where: Prisma.ViajeWhereInput = {};

  if (query) {
    where.OR = [
      {
        conductor: {
          OR: [
            { nombre: { contains: query, mode: "insensitive" } },
            { apellido: { contains: query, mode: "insensitive" } },
          ],
        },
      },
      { pasajero_nombre: { contains: query, mode: "insensitive" } },
    ];
  }

  if (estado) where.estado_actual = estado as $Enums.EstadoViaje;

  // ── Queries en paralelo ─────────────────────────────────────────────────────
  const [
    viajes,
    totalFiltrado,
    viajesHoy,
    recaudacionHoy,
    conductoresActivos,
  ] = await Promise.all([
    prisma.viaje.findMany({
      where,
      take: PAGE_SIZE,
      skip,
      orderBy: { creado_en: "desc" },
      include: { conductor: true, vehiculo: true },
    }),
    prisma.viaje.count({ where }),
    prisma.viaje.count({ where: { creado_en: { gte: hoy } } }),
    prisma.viaje.aggregate({
      _sum: { precio_final: true },
      where: { estado_actual: "FINALIZADO", creado_en: { gte: hoy } },
    }),
    prisma.conductor.count({ where: { isActive: true, estado: "ONLINE" } }),
  ]);

  const totalPaginas = Math.max(1, Math.ceil(totalFiltrado / PAGE_SIZE));
  const recaudacionHoyTotal = recaudacionHoy._sum.precio_final ?? 0;

  // ── Serializar para Client Components ──────────────────────────────────────
  const viajesSerializados: ViajeSerializado[] = viajes.map((v) => ({
    id_viaje: v.id_viaje,
    estado_actual: v.estado_actual,
    creado_en: v.creado_en.toISOString(),
    pasajero_nombre: v.pasajero_nombre,
    id_pasajero: v.id_pasajero,
    origen_direccion: v.origen_direccion,
    destino_direccion: v.destino_direccion,
    precio: v.precio,
    precio_final: v.precio_final,
    metodo_pago: v.metodo_pago,
    tiempo_aceptado: v.tiempo_aceptado.toISOString(),
    tiempo_comienzo: v.tiempo_comienzo ? v.tiempo_comienzo.toISOString() : null,
    tiempo_completado: v.tiempo_completado
      ? v.tiempo_completado.toISOString()
      : null,
    conductor_nombre: v.conductor.nombre,
    conductor_apellido: v.conductor.apellido,
    patente: v.vehiculo.patente,
    fecha_display: formatFecha(v.creado_en),
    monto_display: formatARS(v.precio_final > 0 ? v.precio_final : v.precio),
    conductor_display: `${v.conductor.apellido}, ${v.conductor.nombre}`,
  }));

  // ── Datos para exportar PDF (página actual) ─────────────────────────────────
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

  // ── Tarjetas de métricas del día (sin filtros) ──────────────────────────────
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

  const hayFiltros = query !== "" || estado !== "";

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-white font-sans">
      <Sidebar rol="ADMIN" />

      <main className="flex-1 pt-8 pb-28 md:pb-8 md:pl-72 px-4 md:px-10">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          {/* Encabezado */}
          <HeaderModulo
            titulo="Reportes"
            icono={DollarSign}
            subtitulo={
              hayFiltros
                ? `${totalFiltrado} viaje${totalFiltrado !== 1 ? "s" : ""} encontrado${totalFiltrado !== 1 ? "s" : ""}`
                : `${totalFiltrado} viaje${totalFiltrado !== 1 ? "s" : ""} registrado${totalFiltrado !== 1 ? "s" : ""}`
            }
            acciones={
              <>
                <ExportarPDF viajes={viajesParaPDF} timestamp={timestampReporte} />
                <ThemeToggle />
                <SignOutButton />
              </>
            }
          />

          {/* Métricas del día (siempre globales, sin filtros) */}
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

          {/* Tabla de viajes con búsqueda + filtros + paginación */}
          <div className="rounded-2xl border-2 border-zinc-950 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-[3px_3px_0px_0px_#09090b] dark:shadow-none overflow-hidden">
            <div className="px-5 py-4 border-b-2 border-zinc-950 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950">
              <p className="text-xs font-extrabold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Historial de viajes
              </p>
            </div>

            <div className="p-4 md:p-5">
              <Suspense fallback={<SkeletonTabla />}>
                <ReportesClientLayout
                  viajes={viajesSerializados}
                  totalFiltrado={totalFiltrado}
                  paginaActual={paginaActual}
                  totalPaginas={totalPaginas}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SkeletonTabla() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      ))}
    </div>
  );
}
