// app/page.tsx — Orquestador delgado. Solo decide qué vista renderizar.
import { getSessionData } from "@/lib/getSessionData";
import Sidebar from "@/app/components/Sidebar";
import AdminDashboard from "@/app/_views/AdminDashboard";
import ConductorDashboard from "@/app/_views/ConductorDashboard";
import RegistroConductor from "@/app/_views/RegistroConductor";

export default async function HomePage() {
  const { rol, conductorData } = await getSessionData();

  return (
    <div
      className="flex min-h-screen font-sans"
      style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
    >
      <Sidebar rol={rol} />

      <main className="flex-1 p-4 pb-24 md:p-10 md:pb-10 overflow-y-auto">
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