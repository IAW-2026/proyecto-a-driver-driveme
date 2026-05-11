// app/page.tsx
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Sidebar from "@/app/components/Sidebar";
import ThemeToggle from "@/app/components/ThemeToggle";
import ConnectButton from "@/app/components/ConnectButton";
import { registrarConductor } from "@/app/actions/conductor";

export default async function UnifiedDashboard() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) redirect("/sign-in");

  // 1. Determinar el ROL del usuario
  const adminEmails = ["tu.email.real@gmail.com"]; // ¡Cambiá esto!
  const userEmail = user?.emailAddresses[0]?.emailAddress;

  let rol: 'ADMIN' | 'CONDUCTOR_NUEVO' | 'CONDUCTOR_ACTIVO' = 'CONDUCTOR_NUEVO';
  let conductorData = null;

  if (userEmail && adminEmails.includes(userEmail)) {
    rol = 'ADMIN';
  } else {
    conductorData = await prisma.conductor.findUnique({
      where: { id_conductor: userId },
      include: { vehiculos: true }
    });
    if (conductorData) rol = 'CONDUCTOR_ACTIVO';
  }

  // 3. Renderizar el App Shell
  return (
    <div
      className="flex min-h-screen font-sans transition-colors duration-300"
      style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
    >
      <Sidebar rol={rol} />

      <main
        className="flex-1 p-4 pb-24 md:p-10 md:pb-10 overflow-y-auto transition-colors duration-300"
        style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
      >
        {/* VISTA A: Administrador */}
        {rol === 'ADMIN' && (
          <section>
            <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>Panel de Control de Flota</h1>
            <p className="mt-2" style={{ color: "var(--muted)" }}>Bienvenido al centro de mando. Aquí verás las métricas globales.</p>
            {/* Acá después irían los gráficos o tablas globales */}
          </section>
        )}

        {/* VISTA B: Conductor Activo (Design System Unificado) */}
        {rol === 'CONDUCTOR_ACTIVO' && conductorData && (
          <section
            className="w-full max-w-5xl mx-auto rounded-xl shadow-md border overflow-hidden relative transition-colors duration-300"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            {/* Header */}
            <div
              className="flex justify-between items-center p-4 md:p-6 border-b transition-colors duration-300"
              style={{ borderColor: "var(--border)" }}
            >
              <h1 className="text-sm md:text-lg font-bold tracking-wider" style={{ color: "var(--foreground)" }}>
                DASHBOARD
              </h1>
              <div className="flex items-center justify-center">
                <ThemeToggle />
              </div>
            </div>

            <div className="p-4 md:p-8 space-y-4 md:space-y-6">
              {/* 1. Placeholder del Mapa */}
              <div
                className="w-full h-48 md:h-96 rounded-xl border flex items-center justify-center relative overflow-hidden transition-colors duration-300"
                style={{ backgroundColor: "var(--surface-muted)", borderColor: "var(--border)" }}
              >
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-500 via-gray-300 to-transparent"></div>
                <span
                  className="px-4 py-2 rounded text-sm md:text-lg font-bold z-10 backdrop-blur-sm transition-colors duration-300"
                  style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
                >
                  Mapa GPS (Placeholder)
                </span>
              </div>

              {/* Contenedor flexible */}
              <div className="flex flex-col lg:flex-row gap-4 md:gap-6">

                {/* Panel Izquierdo: Métricas y Botón */}
                <div className="flex-1 space-y-4 md:space-y-6">
                  <ConnectButton
                    conductorId={conductorData.id_conductor}
                    estadoInicial={conductorData.disponible} />

                  {/* Panel de Métricas */}
                  <div className="grid grid-cols-3 gap-2 md:gap-4">
                    {/* Tarjeta 1 */}
                    <div
                      className="p-3 md:p-5 rounded-xl border flex flex-col justify-between h-24 md:h-32 shadow-sm transition-colors duration-300"
                      style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
                    >
                      <span className="text-[10px] md:text-xs font-bold leading-tight" style={{ color: "var(--muted)" }}>HORAS ONLINE<br />(HR:MN)</span>
                      <div className="flex justify-between items-end mt-2">
                        <span className="text-xl md:text-3xl font-bold" style={{ color: "var(--foreground)" }}>---</span>
                        <span className="text-base md:text-xl" style={{ opacity: 0.7 }}>⏱️</span>
                      </div>
                    </div>
                    {/* Tarjeta 2 */}
                    <div
                      className="p-3 md:p-5 rounded-xl border flex flex-col justify-between h-24 md:h-32 shadow-sm transition-colors duration-300"
                      style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
                    >
                      <span className="text-[10px] md:text-xs font-bold leading-tight" style={{ color: "var(--muted)" }}>GANANCIAS<br />ESTIMADAS</span>
                      <div className="flex justify-between items-end mt-2">
                        <span className="text-xl md:text-3xl font-bold" style={{ color: "var(--foreground)" }}>---</span>
                        <span className="text-base md:text-xl" style={{ opacity: 0.7 }}>💵</span>
                      </div>
                    </div>
                    {/* Tarjeta 3 */}
                    <div
                      className="p-3 md:p-5 rounded-xl border flex flex-col justify-between h-24 md:h-32 shadow-sm transition-colors duration-300"
                      style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
                    >
                      <span className="text-[10px] md:text-xs font-bold leading-tight" style={{ color: "var(--muted)" }}>VIAJES<br />COMPLETADOS</span>
                      <div className="flex justify-between items-end mt-2">
                        <span className="text-xl md:text-3xl font-bold" style={{ color: "var(--foreground)" }}>---</span>
                        <span className="text-base md:text-xl" style={{ opacity: 0.7 }}>🚗</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Panel Derecho: Oferta de Viaje */}
                <div className="lg:w-1/3">
                  <div
                    className="rounded-xl border shadow-sm overflow-hidden h-full flex flex-col justify-between mt-2 lg:mt-0 transition-colors duration-300"
                    style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
                  >
                    <div>
                      {/* Cabecera color Lila */}
                      <div
                        className="px-4 py-2 border-b transition-colors duration-300"
                        style={{ backgroundColor: "var(--offer-bg)", borderColor: "var(--border)" }}
                      >
                        <h3 className="text-xs font-bold tracking-wider" style={{ color: "var(--offer-text)" }}>ÚLTIMA OFERTA / SIGUIENTE VIAJE</h3>
                      </div>

                      <div className="p-4 flex gap-4">
                        <div
                          className="w-16 h-16 border flex items-center justify-center shrink-0 rounded-lg transition-colors duration-300"
                          style={{ backgroundColor: "var(--surface-muted)", borderColor: "var(--border)" }}
                        >
                          <span className="text-2xl" style={{ opacity: 0.7 }}>🗺️</span>
                        </div>
                        <div className="flex-1 text-sm font-medium space-y-1" style={{ color: "var(--muted)" }}>
                          <p className="font-bold text-base md:text-lg mb-2" style={{ color: "var(--foreground)" }}>OFERTA: $12.50 EST.</p>
                          <p>PICKUP: 📍 1.2 KM</p>
                          <p>DROP-OFF: 📍 4.5 KM</p>
                          <p>ETA: 8 MIN</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0 flex justify-between items-center gap-3 mt-4">
                      <button
                        className="flex-1 font-bold py-3 rounded-full hover:opacity-90 transition-opacity text-xs md:text-sm tracking-wide shadow-sm"
                        style={{ backgroundColor: "var(--accent)", color: "var(--text-inverted)" }}
                      >
                        ACEPTAR
                      </button>
                      <button
                        className="px-6 py-3 border rounded-full font-bold hover:opacity-80 transition-opacity text-xs md:text-sm"
                        style={{ borderColor: "var(--border)", color: "var(--muted)", backgroundColor: "transparent" }}
                      >
                        RECHAZAR
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>
        )}

        {/* VISTA C: Conductor Nuevo (Formulario de Registro) */}
        {rol === 'CONDUCTOR_NUEVO' && (
          <section
            className="max-w-2xl p-8 rounded-xl shadow-sm border transition-colors duration-300"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <h1 className="text-2xl font-bold border-b pb-4 mb-6" style={{ color: "var(--foreground)", borderColor: "var(--border)" }}>
              Completá tu perfil para empezar a manejar
            </h1>
            <form action={registrarConductor} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>Nombre</label>
                  <input required type="text" name="nombre" className="mt-1 block w-full border rounded-md p-2 bg-transparent focus:ring-2 focus:outline-none transition-colors duration-300" style={{ borderColor: "var(--border)", color: "var(--foreground)" }} />
                </div>
                <div>
                  <label className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>Apellido</label>
                  <input required type="text" name="apellido" className="mt-1 block w-full border rounded-md p-2 bg-transparent focus:ring-2 focus:outline-none transition-colors duration-300" style={{ borderColor: "var(--border)", color: "var(--foreground)" }} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>Licencia</label>
                <input required type="text" name="licencia" className="mt-1 block w-full border rounded-md p-2 bg-transparent focus:ring-2 focus:outline-none transition-colors duration-300" style={{ borderColor: "var(--border)", color: "var(--foreground)" }} />
              </div>
              <h3 className="text-lg font-medium pt-4 border-t" style={{ color: "var(--foreground)", borderColor: "var(--border)" }}>Datos del Vehículo</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>Patente</label>
                  <input required type="text" name="patente" className="mt-1 block w-full border rounded-md p-2 uppercase bg-transparent focus:ring-2 focus:outline-none transition-colors duration-300" style={{ borderColor: "var(--border)", color: "var(--foreground)" }} />
                </div>
                <div>
                  <label className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>Año</label>
                  <input required type="number" name="anio" className="mt-1 block w-full border rounded-md p-2 bg-transparent focus:ring-2 focus:outline-none transition-colors duration-300" style={{ borderColor: "var(--border)", color: "var(--foreground)" }} />
                </div>
                <div>
                  <label className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>Marca</label>
                  <input required type="text" name="marca" className="mt-1 block w-full border rounded-md p-2 bg-transparent focus:ring-2 focus:outline-none transition-colors duration-300" style={{ borderColor: "var(--border)", color: "var(--foreground)" }} />
                </div>
                <div>
                  <label className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>Modelo</label>
                  <input required type="text" name="modelo" className="mt-1 block w-full border rounded-md p-2 bg-transparent focus:ring-2 focus:outline-none transition-colors duration-300" style={{ borderColor: "var(--border)", color: "var(--foreground)" }} />
                </div>
              </div>
              <button
                type="submit"
                className="w-full p-3 rounded-md font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "var(--accent)", color: "var(--text-inverted)" }}
              >
                Guardar Datos
              </button>
            </form>
          </section>
        )}

      </main>
    </div>
  );
}