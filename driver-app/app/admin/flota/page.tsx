/**
 * app/admin/flota/page.tsx
 * Server Component — Lee searchParams, aplica filtros y paginación en la BD,
 * y delega la renderización al Client Component DriverTable.
 *
 * Parámetros de URL soportados:
 *   ?query=      Busca por nombre, apellido o n° de licencia del conductor
 *   ?actividad=  ACTIVO | INACTIVO (default: todos)
 *   ?conexion=   ONLINE | OFFLINE | OCUPADO (default: todos)
 *   ?page=       Número de página (default: 1)
 */
import { Suspense } from "react";
import { Metadata } from "next";
import { Car } from "lucide-react";
import { Prisma, $Enums } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma";
import Sidebar from "@/app/components/Nav";
import HeaderModulo from "@/app/components/HeaderModulo";
import ThemeToggle from "@/app/components/ThemeToggle";
import SignOutButton from "@/app/components/SignOutButton";
import DriverTable from "@/app/components/admin/DriverTable";

export const metadata: Metadata = {
  title: "DriveMe — Gestión de Flota",
  description:
    "Auditá y administrá todos los conductores y vehículos de la flota DriveMe.",
};

const PAGE_SIZE = 10;

export default async function FlotaPage({
  searchParams,
}: {
  searchParams: Promise<{
    query?: string;
    actividad?: string;
    conexion?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;

  const query = params.query?.trim() ?? "";
  const actividad = params.actividad ?? "TODOS";
  const conexion = params.conexion ?? "TODOS";
  const paginaActual = Math.max(1, Number(params.page) || 1);
  const skip = (paginaActual - 1) * PAGE_SIZE;

  // ── Construir cláusula where de Prisma ──────────────────────────────────────
  const where: Prisma.ConductorWhereInput = {};

  if (actividad === "ACTIVO") where.isActive = true;
  else if (actividad === "INACTIVO") where.isActive = false;

  if (conexion !== "TODOS") where.estado = conexion as $Enums.EstadoConductor;

  if (query) {
    where.OR = [
      { nombre: { contains: query, mode: "insensitive" } },
      { apellido: { contains: query, mode: "insensitive" } },
      { licencia: { contains: query, mode: "insensitive" } },
    ];
  }

  // ── Queries en paralelo ─────────────────────────────────────────────────────
  const [conductores, totalFiltrado, totalGlobal] = await Promise.all([
    prisma.conductor.findMany({
      where,
      include: { vehiculos: { orderBy: { patente: "asc" } } },
      orderBy: { apellido: "asc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.conductor.count({ where }),
    prisma.conductor.count(), // total sin filtros para el subtítulo
  ]);

  const totalPaginas = Math.max(1, Math.ceil(totalFiltrado / PAGE_SIZE));
  const hayFiltros =
    query !== "" || actividad !== "TODOS" || conexion !== "TODOS";

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-white font-sans">
      <Sidebar rol="ADMIN" />

      <main className="flex-1 min-w-0 pt-8 pb-28 md:pb-8 md:pl-72 px-4 md:px-10">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          {/* Encabezado */}
          <HeaderModulo
            titulo="Gestión de Flota"
            icono={Car}
            subtitulo={
              hayFiltros
                ? `${totalFiltrado} de ${totalGlobal} conductor${totalGlobal !== 1 ? "es" : ""}`
                : `${totalGlobal} conductor${totalGlobal !== 1 ? "es" : ""} en total`
            }
            acciones={
              <>
                <ThemeToggle />
                <SignOutButton />
              </>
            }
          />

          {/* Tabla con filtros URL (Client Component) */}
          <Suspense fallback={<SkeletonTabla />}>
            <DriverTable
              conductores={conductores}
              totalFiltrado={totalFiltrado}
              totalGlobal={totalGlobal}
              paginaActual={paginaActual}
              totalPaginas={totalPaginas}
            />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

/** Placeholder mientras el Client Component hidrata */
function SkeletonTabla() {
  return (
    <div className="rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden animate-pulse">
      <div className="px-5 py-4 border-b-2 border-zinc-100 dark:border-zinc-800 h-24 bg-zinc-50 dark:bg-zinc-950" />
      <div className="p-5 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800"
          />
        ))}
      </div>
    </div>
  );
}
