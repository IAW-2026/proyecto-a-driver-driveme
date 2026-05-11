import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }

  // 1. Lógica de Administrador: Definimos qué emails son los "Jefes"
  // En producción esto iría en una variable de entorno, pero lo dejamos acá para que lo veas claro.
  const adminEmails = ["tu.email.real@gmail.com"]; // ¡Cambiá esto por tu email de verdad!
  const userEmail = user?.emailAddresses[0].emailAddress;

  if (userEmail && adminEmails.includes(userEmail)) {
    // Si es administrador, lo mandamos a su panel exclusivo
    redirect("/admin/dashboard");
  }

  // 2. Lógica de Conductor: Buscamos si este usuario ya completó sus datos en nuestra BD
  const conductorExistente = await prisma.conductor.findUnique({
    where: { id_conductor: userId },
    include: { vehiculos: true }
  });

  // Si no existe en la base de datos, lo mandamos a que complete su patente y licencia
  if (!conductorExistente) {
    redirect("/registro");
  }

  // 3. Si existe, mostramos su Dashboard de Conductor
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Bienvenido, {conductorExistente.nombre}</h1>
      <p className="mt-2 text-gray-600">
        Vehículo activo: {conductorExistente.vehiculos[0]?.marca} ({conductorExistente.vehiculos[0]?.patente})
      </p>

      <div className="mt-8">
        <Link href="/historial" className="text-blue-600 hover:underline">
          Ver mis viajes
        </Link>
      </div>
    </main>
  );
}