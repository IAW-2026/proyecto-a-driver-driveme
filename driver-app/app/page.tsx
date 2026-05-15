// app/page.tsx — Orquestador delgado. Solo decide qué vista renderizar.
import { getSessionData } from "@/lib/getSessionData";
import Sidebar from "@/app/components/Sidebar";
import AdminDashboard from "@/app/_views/AdminDashboard";
import ConductorDashboard from "@/app/_views/ConductorDashboard";
import RegistroConductor from "@/app/_views/RegistroConductor";

export default async function HomePage() {
  const { rol, conductorData } = await getSessionData();

  return (
    <div className="flex min-h-screen w-full bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-white font-sans">
      <Sidebar rol={rol} />

      {/* Se cambió pt-20 por pt-8 para eliminar el espacio vacío superior */}
      <main className="flex-1 pt-8 pb-24 md:pb-8 md:pl-72 px-4 md:px-10 overflow-y-auto">
        {rol === "ADMIN" && <AdminDashboard />}

        {rol === "CONDUCTOR_ACTIVO" && conductorData && (
          <ConductorDashboard conductorData={conductorData} />
        )}

        {rol === "CONDUCTOR_NUEVO" && (
          <div className="flex justify-center">
            <RegistroConductor />
          </div>
        )}
      </main>
    </div>
  );
}