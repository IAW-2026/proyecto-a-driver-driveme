/**
 * app/admin/reportes/page.tsx
 * Server Component — Listado paginado y filtrable de viajes de toda la flota.
 * Dark Sci-Fi aesthetic.
 */
import { Suspense } from "react";
import { Metadata } from "next";
import { DollarSign, BarChart3, Route, Users } from "lucide-react";
import { Prisma, $Enums } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma";
import Sidebar from "@/app/components/Nav";
import HeaderModulo from "@/app/components/HeaderModulo";
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
    prisma.conductor.count({ where: { isActive: true, estado: "ONLINE" } }),
  ]);

  const totalPaginas = Math.max(1, Math.ceil(totalFiltrado / PAGE_SIZE));

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
      label: "Viajes de Hoy",
      valor: viajesHoy.toString(),
      icono: <Route className="w-8 h-8" strokeWidth={2.5} />,
      acento: "primary" as const,
    },
    {
      label: "Conductores Activos",
      valor: conductoresActivos.toString(),
      icono: <Users className="w-8 h-8" strokeWidth={2.5} />,
      acento: "success" as const,
    },
  ];

  const hayFiltros = query !== "" || estado !== "";

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen w-full overflow-x-hidden font-sans">
      <Sidebar rol="ADMIN" nombre={undefined} />

      <main className="flex-1 min-w-0 pt-8 md:pt-28 pb-28 md:pb-8 px-4 md:px-10">
        <div className="w-full max-w-6xl mx-auto space-y-8">
          {/* Encabezado */}
          <HeaderModulo
            titulo="Reportes"
            icono={DollarSign}
            subtitulo={
              hayFiltros
                ? `${totalFiltrado} registro${totalFiltrado !== 1 ? "s" : ""} encontrado${totalFiltrado !== 1 ? "s" : ""}`
                : `${totalFiltrado} registro${totalFiltrado !== 1 ? "s" : ""} en base de datos`
            }
            acciones={
              <>
                <ExportarPDF viajes={viajesParaPDF} timestamp={timestampReporte} />
                <SignOutButton />
              </>
            }
          />

          {/* Métricas del día (siempre globales, sin filtros) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 overflow-hidden">
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
          <div className="rounded-modal border border-[rgba(220,38,38,0.15)] bg-[rgba(20,20,20,0.8)] shadow-[0_0_30px_rgba(220,38,38,0.08)] backdrop-blur-sm overflow-hidden">
            <div className="px-5 py-5 border-b border-[rgba(220,38,38,0.15)] bg-[#0A0A0A]">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#9CA3AF]">
                Historial de Viajes
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
        <div key={i} className="h-12 rounded-sharp bg-[#1F1F1F]" />
      ))}
    </div>
  );
}
