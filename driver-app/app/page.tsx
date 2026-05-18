// app/page.tsx — Orquestador delgado. Solo decide qué vista renderizar.
import { getSessionData } from "@/lib/getSessionData";
import prisma from "@/lib/prisma"; // Importamos Prisma para hacer la consulta a la BD
import Sidebar from "@/app/components/Sidebar";
import AdminDashboard from "@/app/_views/AdminDashboard";
import ConductorDashboard from "@/app/_views/ConductorDashboard";
import RegistroConductor from "@/app/_views/RegistroConductor";

export default async function HomePage() {
  const { rol, conductorData } = await getSessionData();

  // ── CÁLCULO DE MÉTRICAS REALES ─────────────────────────
  let metricasHoy = { ganancia: 0, viajes: 0, horas: "0.0", metaDiaria: 30000 };

  if (rol === "CONDUCTOR_ACTIVO" && conductorData) {
    // Calculamos el inicio del día actual (00:00:00)
    const inicioDelDia = new Date();
    inicioDelDia.setHours(0, 0, 0, 0);

    // Buscamos los viajes del conductor de HOY que estén finalizados
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
      orderBy: { timestamp: 'asc' } // Ordenamos de más viejo a más nuevo
    });

    let totalMilisegundos = 0;
    let ultimaConexion: number | null = null;

    // Recorremos el historial sumando el tiempo entre cada "ONLINE" y "OFFLINE"
    conexionesHoy.forEach(registro => {
      if (registro.estado === "ONLINE") {
        ultimaConexion = registro.timestamp.getTime();
      } else if (registro.estado === "OFFLINE" && ultimaConexion !== null) {
        totalMilisegundos += registro.timestamp.getTime() - ultimaConexion;
        ultimaConexion = null;
      }
    });

    // Si el chofer sigue conectado AHORA mismo, sumamos el tiempo desde su último "ONLINE" hasta este instante
    if (ultimaConexion !== null) {
      totalMilisegundos += new Date().getTime() - ultimaConexion;
    }

    const horasCalculadas = (totalMilisegundos / (1000 * 60 * 60)).toFixed(1);

    // 3. Juntamos todo en el objeto final (¡ahora sí, 100% real!)
    metricasHoy = {
      ganancia: gananciaTotal,
      viajes: viajesDeHoy.length,
      horas: horasCalculadas,
      metaDiaria: conductorData.meta_diaria || 30000
    };
  }

  return (
    <div className="flex min-h-screen w-full bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-white font-sans">
      <Sidebar rol={rol} />
      <main className="flex-1 pt-8 pb-24 md:pb-8 md:pl-72 px-4 md:px-10 overflow-y-auto">
        {rol === "ADMIN" && <AdminDashboard />}

        {rol === "CONDUCTOR_ACTIVO" && conductorData && (
          // Inyectamos las métricas reales como propiedad
          <ConductorDashboard conductorData={conductorData} metricasHoy={metricasHoy} />
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