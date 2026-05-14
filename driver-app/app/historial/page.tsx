// app/historial/page.tsx
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSessionData } from "@/lib/getSessionData";
import StatusBadge from "@/app/components/StatusBadge";
import Sidebar from "@/app/components/Sidebar";
import ThemeToggle from "@/app/components/ThemeToggle";

export default async function HistorialViajes() {
  const { userId, rol } = await getSessionData();

  if (rol === "CONDUCTOR_NUEVO") redirect("/");

  const viajes = await prisma.viaje.findMany({
    where: rol === "ADMIN" ? {} : { id_conductor: userId },
    orderBy: { tiempo_aceptado: "desc" },
    include: {
      conductor: true,
      vehiculo: true,
    },
  });

  return (
    <div
      className="flex min-h-screen font-sans"
      style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
    >
      <Sidebar rol={rol} />

      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div
            className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6 md:mb-8 border-b pb-4"
            style={{ borderColor: "var(--border)" }}
          >
            <div>
              <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--foreground)" }}>
                {rol === "ADMIN" ? "Historial de la Flota" : "Mis Viajes"}
              </h1>
              <p className="mt-1 text-sm md:text-base" style={{ color: "var(--muted)" }}>
                {viajes.length} viaje{viajes.length !== 1 ? "s" : ""} registrado{viajes.length !== 1 ? "s" : ""}.
              </p>
            </div>
            <ThemeToggle />
          </div>

          <div
            className="rounded-xl shadow-sm border overflow-x-auto"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <table className="w-full text-left border-collapse min-w-[580px]">
              <thead>
                <tr
                  className="text-xs md:text-sm"
                  style={{ backgroundColor: "var(--accent)", color: "var(--text-inverted)" }}
                >
                  <th className="p-3 md:p-4 font-semibold whitespace-nowrap rounded-tl-xl">Fecha</th>
                  {rol === "ADMIN" && (
                    <th className="p-3 md:p-4 font-semibold whitespace-nowrap">Conductor</th>
                  )}
                  <th className="p-3 md:p-4 font-semibold whitespace-nowrap">Vehículo</th>
                  <th className="p-3 md:p-4 font-semibold whitespace-nowrap">Precio</th>
                  <th className="p-3 md:p-4 font-semibold whitespace-nowrap">Método</th>
                  <th className="p-3 md:p-4 font-semibold text-center whitespace-nowrap rounded-tr-xl">Estado</th>
                </tr>
              </thead>
              <tbody>
                {viajes.map((viaje) => (
                  <tr
                    key={viaje.id_viaje}
                    className="border-b last:border-b-0 hover:bg-[var(--surface-muted)] transition-colors"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <td className="p-3 md:p-4 text-xs md:text-sm whitespace-nowrap" style={{ color: "var(--foreground)" }}>
                      {new Date(viaje.tiempo_aceptado).toLocaleDateString("es-AR", {
                        day: "2-digit", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>

                    {rol === "ADMIN" && (
                      <td className="p-3 md:p-4 text-xs md:text-sm whitespace-nowrap" style={{ color: "var(--foreground)" }}>
                        {viaje.conductor.nombre} {viaje.conductor.apellido}
                      </td>
                    )}

                    <td className="p-3 md:p-4 text-xs md:text-sm whitespace-nowrap">
                      <p style={{ color: "var(--foreground)" }}>
                        {viaje.vehiculo.marca} {viaje.vehiculo.modelo}
                      </p>
                      <p className="text-[10px] font-mono" style={{ color: "var(--muted)" }}>
                        {viaje.vehiculo.patente}
                      </p>
                    </td>

                    <td className="p-3 md:p-4 font-bold text-sm whitespace-nowrap" style={{ color: "var(--foreground)" }}>
                      {/* BD original usa 'precio', el extended usa 'precio_final' */}
                      {(viaje.precio_final > 0 ? viaje.precio_final : viaje.precio) > 0
                        ? `$${(viaje.precio_final || viaje.precio).toLocaleString("es-AR")}`
                        : "—"}
                    </td>

                    <td className="p-3 md:p-4 text-xs whitespace-nowrap" style={{ color: "var(--muted)" }}>
                      {viaje.metodo_pago}
                    </td>

                    <td className="p-3 md:p-4 text-center whitespace-nowrap">
                      <StatusBadge estado={viaje.estado_actual} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {viajes.length === 0 && (
              <div className="p-12 text-center" style={{ color: "var(--muted)" }}>
                <p className="text-4xl mb-3">🚗</p>
                <p className="font-medium">No hay viajes registrados todavía.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}