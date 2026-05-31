// app/page.tsx — Orquestador delgado. Solo decide qué vista renderizar.
import { getSessionData } from "@/lib/getSessionData";
import prisma from "@/lib/prisma"; // Importamos Prisma para hacer la consulta a la BD
import Sidebar from "@/app/components/Nav";
import AdminDashboard from "@/app/_views/AdminDashboard";
import ConductorDashboard from "@/app/_views/ConductorDashboard";
import RegistroConductor from "@/app/_views/RegistroConductor";

export default async function HomePage() {
  const { rol, conductorData } = await getSessionData();

  // ── CÁLCULO DE MÉTRICAS REALES ─────────────────────────
  let metricasHoy = { ganancia: 0, viajes: 0, horas: "0.0", metaDiaria: 30000 };

  if (rol === "CONDUCTOR_ACTIVO" && conductorData) {
    const inicioDelDia = new Date();
    inicioDelDia.setHours(0, 0, 0, 0);

    const viajesDeHoy = await prisma.viaje.findMany({
      where: {
        id_conductor: conductorData.id_conductor,
        tiempo_aceptado: { gte: inicioDelDia },
        estado_actual: "FINALIZADO"
      }
    });

    const gananciaTotal = viajesDeHoy.reduce((acc, viaje) => acc + (viaje.precio_final > 0 ? viaje.precio_final : viaje.precio), 0);

    const conexionesHoy = await prisma.historialConexion.findMany({
      where: {
        id_conductor: conductorData.id_conductor,
        timestamp: { gte: inicioDelDia }
      },
      orderBy: { timestamp: 'asc' }
    });

    let totalMilisegundos = 0;
    let ultimaConexion: number | null = null;

    conexionesHoy.forEach(registro => {
      if (registro.estado === "ONLINE") {
        ultimaConexion = registro.timestamp.getTime();
      } else if (registro.estado === "OFFLINE" && ultimaConexion !== null) {
        totalMilisegundos += registro.timestamp.getTime() - ultimaConexion;
        ultimaConexion = null;
      }
    });

    if (ultimaConexion !== null) {
      totalMilisegundos += new Date().getTime() - ultimaConexion;
    }

    const horasCalculadas = (totalMilisegundos / (1000 * 60 * 60)).toFixed(1);

    metricasHoy = {
      ganancia: gananciaTotal,
      viajes: viajesDeHoy.length,
      horas: horasCalculadas,
      metaDiaria: conductorData.meta_diaria || 30000
    };
  }

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-white font-sans">
      <Sidebar rol={rol} />
      <main className="flex-1 pt-8 pb-24 md:pb-8 md:pl-72 px-4 md:px-10 overflow-y-auto">
        {rol === "ADMIN" && <AdminDashboard />}

        {rol === "CONDUCTOR_ACTIVO" && conductorData && (
          <ConductorDashboard conductorData={conductorData} metricasHoy={metricasHoy} />
        )}

        {rol === "CONDUCTOR_NUEVO" && (
          <div className="flex justify-center">
            <RegistroConductor />
          </div>
        )}

        {rol === "CONDUCTOR_SUSPENDIDO" && (
          <div className="flex justify-center items-center h-[50vh]">
            <div className="max-w-md w-full p-8 rounded-2xl border-2 border-alert bg-white dark:bg-zinc-900 shadow-[6px_6px_0px_0px_#ff007f] text-center">
              <h1 className="text-2xl font-bold text-alert mb-4">Cuenta Suspendida</h1>
              <p className="text-zinc-700 dark:text-zinc-300 font-medium">
                Tu cuenta ha sido inhabilitada temporalmente por un administrador debido a infracciones en nuestras políticas.
              </p>
              <p className="text-zinc-700 dark:text-zinc-300 font-medium mt-4">
                Si creés que esto es un error, por favor contactá a soporte.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}