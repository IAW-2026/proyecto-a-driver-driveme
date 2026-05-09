import prisma from "@/lib/prisma";
import Nav from "./components/Nav";

export default async function Home() {
  // Traemos los conductores desde tu base de datos en la nube (Neon)
  const conductores = await prisma.conductor.findMany({
    include: {
      vehiculos: true, // Traemos también los autos relacionados
    }
  });

  return (
    <main className="p-8">
      <Nav />

      <section>
        <h2 className="text-xl font-semibold mb-4">Conductores Registrados (Seed):</h2>
        <div className="grid gap-4">
          {conductores.map((conductor) => (
            <div key={conductor.id_conductor} className="p-4 border rounded shadow-sm">
              <p><strong>Nombre:</strong> {conductor.nombre} {conductor.apellido}</p>
              <p><strong>Licencia:</strong> {conductor.licencia}</p>
              {/* Verificamos que tenga al menos un vehículo antes de mostrarlo */}
              {conductor.vehiculos.length > 0 ? (
                <p><strong>Vehículo asignado:</strong> {conductor.vehiculos[0].marca} {conductor.vehiculos[0].modelo} ({conductor.vehiculos[0].patente})</p>
              ) : (
                <p><strong>Vehículo asignado:</strong> Ninguno</p>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}