import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function RegistroPage() {
  // 1. Verificamos que haya una sesión activa en Clerk
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // 2. Definimos el Server Action que se ejecutará al enviar el formulario
  async function registrarConductor(formData: FormData) {
    "use server"; // Esta directiva convierte la función en un endpoint seguro

    const { userId } = await auth();
    if (!userId) {
      redirect("/sign-in");
    }
    const nombre = formData.get("nombre") as string;
    const apellido = formData.get("apellido") as string;
    const licencia = formData.get("licencia") as string;
    const patente = formData.get("patente") as string;
    const marca = formData.get("marca") as string;
    const modelo = formData.get("modelo") as string;
    const anio = parseInt(formData.get("anio") as string, 10);

    // Acá ocurre la magia: Insertamos en Prisma usando el ID de Clerk
    await prisma.conductor.create({
      data: {
        id_conductor: userId,
        nombre,
        apellido,
        licencia,
        vehiculos: {
          create: {
            patente,
            marca,
            modelo,
            anio,
          }
        }
      }
    });

    // Una vez guardado, lo mandamos al inicio (Dashboard)
    redirect("/");
  }

  return (
    <main className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold" style={{ color: "var(--foreground)" }}>
          Completá tu perfil
        </h2>
        <p className="mt-2 text-center text-sm" style={{ color: "var(--muted)" }}>
          Necesitamos los datos de tu vehículo para habilitarte en la flota.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="py-8 px-4 shadow sm:rounded-lg sm:px-10" style={{ backgroundColor: "var(--surface)", color: "var(--foreground)" }}>
          {/* El formulario ejecuta el Server Action directamente */}
          <form action={registrarConductor} className="space-y-6">

            {/* Datos Personales */}
            <div>
              <h3 className="text-lg font-medium mb-4 border-b pb-2" style={{ color: "var(--foreground)", borderColor: "var(--border)" }}>Datos del Conductor</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>Nombre</label>
                  <input required type="text" name="nombre" id="nombre" className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[3px] focus:ring-[#4FD1C5]/20 sm:text-sm transition-shadow" style={{ borderColor: "var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface-muted)" }} />
                </div>
                <div>
                  <label htmlFor="apellido" className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>Apellido</label>
                  <input required type="text" name="apellido" id="apellido" className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[3px] focus:ring-[#4FD1C5]/20 sm:text-sm transition-shadow" style={{ borderColor: "var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface-muted)" }} />
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="licencia" className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>Número de Licencia</label>
                <input required type="text" name="licencia" id="licencia" className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[3px] focus:ring-[#4FD1C5]/20 sm:text-sm transition-shadow" style={{ borderColor: "var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface-muted)" }} />
              </div>
            </div>

            {/* Datos del Vehículo */}
            <div className="pt-4">
              <h3 className="text-lg font-medium mb-4 border-b pb-2" style={{ color: "var(--foreground)", borderColor: "var(--border)" }}>Vehículo Activo</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="patente" className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>Patente</label>
                  <input required type="text" name="patente" id="patente" className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[3px] focus:ring-[#4FD1C5]/20 sm:text-sm uppercase transition-shadow" style={{ borderColor: "var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface-muted)" }} />
                </div>
                <div>
                  <label htmlFor="anio" className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>Año</label>
                  <input required type="number" name="anio" id="anio" min="1990" max="2026" className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[3px] focus:ring-[#4FD1C5]/20 sm:text-sm transition-shadow" style={{ borderColor: "var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface-muted)" }} />
                </div>
                <div>
                  <label htmlFor="marca" className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>Marca</label>
                  <input required type="text" name="marca" id="marca" placeholder="Ej: Toyota" className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[3px] focus:ring-[#4FD1C5]/20 sm:text-sm transition-shadow" style={{ borderColor: "var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface-muted)" }} />
                </div>
                <div>
                  <label htmlFor="modelo" className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>Modelo</label>
                  <input required type="text" name="modelo" id="modelo" placeholder="Ej: Corolla" className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[3px] focus:ring-[#4FD1C5]/20 sm:text-sm transition-shadow" style={{ borderColor: "var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface-muted)" }} />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:opacity-90 transition-all focus:outline-none focus:ring-[3px] focus:ring-[#4FD1C5]/30" style={{ background: "var(--gradient-primary)", color: "var(--text-inverted)" }}>
                Registrar y Comenzar a Manejar
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}