import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import NeonInput from "@/app/components/NeonInput";

export default async function RegistroPage() {
  // 1. Verificamos que haya una sesión activa en Clerk
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // 2. Definimos el Server Action que se ejecutará al enviar el formulario
  async function registrarConductor(formData: FormData) {
    "use server";

    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const nombre = formData.get("nombre") as string;
    const apellido = formData.get("apellido") as string;
    const licencia = formData.get("licencia") as string;
    const patente = formData.get("patente") as string;
    const marca = formData.get("marca") as string;
    const modelo = formData.get("modelo") as string;
    const anio = parseInt(formData.get("anio") as string, 10);
    const color = String(formData.get("color") ?? "No especificado");

    await prisma.conductor.create({
      data: {
        id_conductor: userId,  // PK real de la BD
        nombre,
        apellido,
        licencia,
        vehiculos: {
          create: {
            patente: patente.toUpperCase(),
            marca,
            modelo,
            anio,
            color,
          }
        }
      }
    });

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
                  <NeonInput required type="text" name="nombre" id="nombre" />
                </div>
                <div>
                  <label htmlFor="apellido" className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>Apellido</label>
                  <NeonInput required type="text" name="apellido" id="apellido" />
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="licencia" className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>Número de Licencia de Conducir</label>
                <NeonInput required type="text" name="licencia" id="licencia" placeholder="Ej: 12345678" />
              </div>
            </div>

            {/* Datos del Vehículo */}
            <div className="pt-4">
              <h3 className="text-lg font-medium mb-4 border-b pb-2" style={{ color: "var(--foreground)", borderColor: "var(--border)" }}>Vehículo Activo</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="patente" className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>Patente</label>
                  <NeonInput required type="text" name="patente" id="patente" placeholder="Ej: 12345678" className="uppercase" />
                </div>
                <div>
                  <label htmlFor="anio" className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>Año</label>
                  <NeonInput required type="number" name="anio" id="anio" min="1990" max="2026" />
                </div>
                <div>
                  <label htmlFor="marca" className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>Marca</label>
                  <NeonInput required type="text" name="marca" id="marca" placeholder="Ej: Toyota" />
                </div>
                <div>
                  <label htmlFor="modelo" className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>Modelo</label>
                  <NeonInput required type="text" name="modelo" id="modelo" placeholder="Ej: Corolla" />
                </div>
                <div>
                  <label htmlFor="color" className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>Color</label>
                  <NeonInput required type="text" name="color" id="color" placeholder="Ej: Blanco" />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full rounded-2xl border-2 border-zinc-950 bg-brand px-6 py-4 text-sm font-extrabold text-zinc-950 uppercase tracking-[0.08em] shadow-[4px_4px_0px_0px_#09090b] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#09090b] dark:border-2 dark:border-brand dark:bg-zinc-950 dark:shadow-[4px_4px_0px_0px_#CFFF04] dark:hover:-translate-y-1 dark:hover:shadow-[6px_6px_0px_0px_#CFFF04] focus:outline-none focus:ring-4 focus:ring-brand/30 disabled:opacity-60"
              >
                Registrar y Comenzar a Manejar
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}