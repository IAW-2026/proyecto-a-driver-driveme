import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import StatusBadge from "../components/StatusBadge";
import Sidebar from "../components/Sidebar";
import ThemeToggle from "../components/ThemeToggle";

export default async function HistorialViajes() {
  // 1. Autenticación y obtención de usuario de Clerk
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) redirect("/sign-in");

  // 2. Determinar ROL (Igual que en el Dashboard)
  const adminEmails = ["tu.email.real@gmail.com"]; // ¡Acordate de poner tu email real!
  const userEmail = user?.emailAddresses[0]?.emailAddress;

  let rol: 'ADMIN' | 'CONDUCTOR_NUEVO' | 'CONDUCTOR_ACTIVO' = 'CONDUCTOR_NUEVO';
  let conductorData = null;

  if (userEmail && adminEmails.includes(userEmail)) {
    rol = 'ADMIN';
  } else {
    conductorData = await prisma.conductor.findUnique({
      where: { id_conductor: userId }
    });
    if (conductorData) rol = 'CONDUCTOR_ACTIVO';
  }

  // 3. Consultar a Prisma dependiendo del ROL
  let viajes = [];

  if (rol === 'ADMIN') {
    // El admin ve TODO
    viajes = await prisma.viaje.findMany({
      orderBy: { creado_en: 'desc' },
      include: {
        conductor: true,
        vehiculo: true,
      }
    });
  } else if (rol === 'CONDUCTOR_ACTIVO') {
    // El conductor SOLO ve lo suyo
    viajes = await prisma.viaje.findMany({
      where: { id_conductor: userId },
      orderBy: { creado_en: 'desc' },
      include: {
        conductor: true,
        vehiculo: true,
      }
    });
  } else {
    // Si es conductor nuevo (sin registrar), no tiene viajes
    redirect("/");
  }

  // 4. Renderizar la vista con el App Shell (Sidebar + Main)
  return (
    <div
      className="flex min-h-screen font-sans transition-colors duration-300"
      style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
    >
      {/* Reemplazamos el Nav por el Sidebar universal */}
      <Sidebar rol={rol} />

      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto transition-colors duration-300">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div
            className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6 md:mb-8 border-b pb-4 transition-colors duration-300"
            style={{ borderColor: "var(--border)" }}
          >
            <div>
              <h1 className="text-2xl md:text-3xl font-bold transition-colors duration-300" style={{ color: "var(--foreground)" }}>
                {rol === 'ADMIN' ? 'Historial de la Flota' : 'Mis Viajes'}
              </h1>
              <p className="mt-1 text-sm md:text-base transition-colors duration-300" style={{ color: "var(--muted)" }}>
                {rol === 'ADMIN'
                  ? 'Registro completo de la actividad de todos los conductores.'
                  : 'Registro de todos tus viajes realizados y sus ganancias.'}
              </p>
            </div>

            <div className="flex items-center justify-end w-full md:w-auto">
              <ThemeToggle />
            </div>
          </div>

          {/* Tabla de Viajes */}
          <div
            className="rounded-lg shadow-sm border overflow-x-auto transition-colors duration-300"
            style={{ backgroundColor: "var(--surface-muted)", borderColor: "var(--border)" }}
          >
            <table className="w-full text-left border-collapse min-w-[600px] md:min-w-full">
              <thead>
                <tr
                  className="text-xs md:text-sm transition-colors duration-300"
                  style={{ backgroundColor: "var(--accent)", color: "var(--text-inverted)" }}
                >
                  <th className="p-3 md:p-4 font-semibold whitespace-nowrap">Fecha</th>

                  {/* Si es Admin, mostramos de quién es el viaje. Si es el conductor, no hace falta. */}
                  {rol === 'ADMIN' && (
                    <th className="p-3 md:p-4 font-semibold whitespace-nowrap">Conductor</th>
                  )}

                  <th className="p-3 md:p-4 font-semibold whitespace-nowrap">Vehículo</th>
                  <th className="p-3 md:p-4 font-semibold whitespace-nowrap">Precio</th>
                  <th className="p-3 md:p-4 font-semibold text-center whitespace-nowrap">Estado</th>
                </tr>
              </thead>
              <tbody style={{ borderColor: "var(--border)" }}>
                {viajes.map((viaje) => (
                  <tr
                    key={viaje.id_viaje}
                    className="transition-colors hover:bg-[var(--surface-muted)] border-b last:border-b-0"
                    style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
                  >
                    <td className="p-3 md:p-4 text-xs md:text-sm whitespace-nowrap transition-colors duration-300" style={{ color: "var(--foreground)" }}>
                      {new Date(viaje.creado_en).toLocaleDateString('es-AR', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>

                    {/* Fila exclusiva para Admin */}
                    {rol === 'ADMIN' && (
                      <td className="p-3 md:p-4 text-xs md:text-sm whitespace-nowrap">
                        <p className="font-medium transition-colors duration-300" style={{ color: "var(--foreground)" }}>
                          {viaje.conductor.nombre} {viaje.conductor.apellido}
                        </p>
                      </td>
                    )}

                    <td className="p-3 md:p-4 text-xs md:text-sm whitespace-nowrap">
                      <p className="transition-colors duration-300" style={{ color: "var(--foreground)" }}>
                        {viaje.vehiculo.marca} {viaje.vehiculo.modelo}
                      </p>
                      <p className="text-[10px] md:text-xs font-mono transition-colors duration-300" style={{ color: "var(--muted)" }}>
                        {viaje.vehiculo.patente}
                      </p>
                    </td>
                    <td className="p-3 md:p-4 font-medium text-xs md:text-sm whitespace-nowrap transition-colors duration-300" style={{ color: "var(--foreground)" }}>
                      {viaje.precio > 0 ? `$${viaje.precio.toLocaleString('es-AR')}` : '-'}
                    </td>
                    <td className="p-3 md:p-4 text-center whitespace-nowrap">
                      <StatusBadge estado={viaje.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {viajes.length === 0 && (
              <div className="p-8 text-center transition-colors duration-300" style={{ color: "var(--muted)" }}>
                No se encontraron viajes registrados en el historial.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}