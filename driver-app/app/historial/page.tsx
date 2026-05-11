import prisma from "@/lib/prisma";
import StatusBadge from "../components/StatusBadge";
import Link from "next/link";
import Nav from "../components/Nav";
import ThemeToggle from "../components/ThemeToggle";

export default async function HistorialViajes() {
  // Traemos todos los viajes con Prisma, incluyendo los datos del conductor y el auto
  const viajes = await prisma.viaje.findMany({
    orderBy: {
      creado_en: 'desc'
    },
    include: {
      conductor: true,
      vehiculo: true,
    }
  });

  return (
    <main
      className="p-8 min-h-screen font-sans"
      style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
    >
      <div className="max-w-6xl mx-auto">
        <Nav />

        <div
          className="flex justify-between items-center mb-8 border-b pb-4"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>
              Historial de Viajes
            </h1>
            <p className="mt-1" style={{ color: "var(--muted)" }}>
              Registro completo de la actividad de la flota.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-4 py-2 rounded hover:opacity-90 transition-colors"
              style={{ backgroundColor: "var(--accent)", color: "var(--text-inverted)" }}
            >
              Volver al Inicio
            </Link>
            <ThemeToggle />
          </div>
        </div>

        <div
          className="rounded-lg shadow-sm border overflow-hidden"
          style={{ backgroundColor: "var(--surface-muted)", borderColor: "var(--border)" }}
        >
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className="text-sm"
                style={{ backgroundColor: "var(--accent)", color: "var(--text-inverted)" }}
              >
                <th className="p-4 font-semibold">Fecha</th>
                <th className="p-4 font-semibold">Conductor</th>
                <th className="p-4 font-semibold">Vehículo</th>
                <th className="p-4 font-semibold">Precio</th>
                <th className="p-4 font-semibold text-center">Estado</th>
              </tr>
            </thead>
            <tbody style={{ borderColor: "var(--border)" }}>
              {viajes.map((viaje) => (
                <tr
                  key={viaje.id_viaje}
                  className="transition-colors"
                  style={{ backgroundColor: "var(--surface)" }}
                >
                  <td className="p-4 text-sm" style={{ color: "var(--foreground)" }}>
                    {new Date(viaje.creado_en).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="p-4 text-sm">
                    <p className="font-medium" style={{ color: "var(--foreground)" }}>
                      {viaje.conductor.nombre} {viaje.conductor.apellido}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      Lic: {viaje.conductor.licencia}
                    </p>
                  </td>
                  <td className="p-4 text-sm">
                    <p style={{ color: "var(--foreground)" }}>
                      {viaje.vehiculo.marca} {viaje.vehiculo.modelo}
                    </p>
                    <p className="text-xs font-mono" style={{ color: "var(--muted)" }}>
                      {viaje.vehiculo.patente}
                    </p>
                  </td>
                  <td className="p-4 font-medium" style={{ color: "var(--foreground)" }}>
                    {viaje.precio > 0 ? `$${viaje.precio.toLocaleString('es-AR')}` : '-'}
                  </td>
                  <td className="p-4 text-center">
                    <StatusBadge estado={viaje.estado} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {viajes.length === 0 && (
            <div className="p-8 text-center" style={{ color: "var(--muted)" }}>
              No se encontraron viajes registrados.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
