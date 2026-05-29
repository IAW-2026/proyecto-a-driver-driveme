/**
 * app/admin/flota/page.tsx
 * Server Component — Obtiene TODOS los conductores (sin filtros) y delega
 * el filtrado y la renderización de la tabla al Client Component DriverTable.
 */
import { Metadata } from "next";
import { Car } from "lucide-react";
import prisma from "@/lib/prisma";
import Sidebar from "@/app/components/Sidebar";
import HeaderModulo from "@/app/components/HeaderModulo";
import ThemeToggle from "@/app/components/ThemeToggle";
import DriverTable from "@/app/components/admin/DriverTable";

export const metadata: Metadata = {
  title: "DriveMe — Gestión de Flota",
  description: "Auditá y administrá todos los conductores y vehículos de la flota DriveMe.",
};

export default async function FlotaPage() {
  // Sin filtros: el administrador debe poder auditar TODOS los registros.
  const conductores = await prisma.conductor.findMany({
    include: {
      vehiculos: {
        orderBy: { patente: "asc" },
      },
    },
    orderBy: { apellido: "asc" },
  });

  return (
    <div className="flex min-h-screen w-full bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-white font-sans">
      <Sidebar rol="ADMIN" />

      <main className="flex-1 pt-8 pb-24 md:pb-8 md:pl-72 px-4 md:px-10">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          {/* Encabezado */}
          <HeaderModulo
            titulo="Gestión de Flota"
            icono={Car}
            subtitulo={`${conductores.length} conductor${conductores.length !== 1 ? "es" : ""} en total`}
            acciones={<ThemeToggle />}
          />

          {/* Tabla con filtros (Client Component) */}
          <DriverTable conductores={conductores} />
        </div>
      </main>
    </div>
  );
}
