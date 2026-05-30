// app/billetera/page.tsx
import { redirect } from "next/navigation";
import { getSessionData } from "@/lib/getSessionData";
import BilleteraClient from "./BilleteraClient";

export const metadata = {
  title: "Mi Billetera — DriveMe Conductores",
  description: "Historial de transacciones y estado de liquidación de ganancias.",
};

export default async function BilleteraPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filtro?: string }>;
}) {
  const { userId, rol } = await getSessionData();

  if (rol === "CONDUCTOR_NUEVO" || rol === "ADMIN") {
    redirect("/");
  }

  // 1. Resolver searchParams como Promesa (consistente con tu página de perfil)
  const resolvedParams = await searchParams;
  const currentPage = Number(resolvedParams.page) || 1;
  const currentFiltro = resolvedParams.filtro || "TODOS";
  const ITEMS_POR_PAGINA = 10;
  const skip = (currentPage - 1) * ITEMS_POR_PAGINA;

  // 2. Definir la URL base para el microservicio de pagos interno/mockeado
  const baseUrl = process.env.PAYMENTS_APP_URL;

  

  let billetera = null;
  let transaccionesPaginadas: any[] = [];
  let totalPages = 0;

  try {
    // Consultar en paralelo ambos endpoints desde el servidor para optimizar tiempos
    const [resBilletera, resTxns] = await Promise.all([
      fetch(`${baseUrl}/conductores/${userId}/billetera`, { cache: "no-store" }),
      fetch(`${baseUrl}/conductores/${userId}/transacciones`, { cache: "no-store" })
    ]);

    if (resBilletera.ok) {
      billetera = await resBilletera.json();
    }

    if (resTxns.ok) {
      const dataTxns = await resTxns.json();
      const txnsSeguras = Array.isArray(dataTxns.transacciones) ? dataTxns.transacciones : [];

      // 3. Filtrado lógico en el servidor
      const txnsFiltradas = txnsSeguras.filter((t: any) =>
        currentFiltro === "TODOS" ? true : t.liquidacion === currentFiltro
      );

      // 4. Paginación matemática en el servidor
      totalPages = Math.ceil(txnsFiltradas.length / ITEMS_POR_PAGINA);
      transaccionesPaginadas = txnsFiltradas.slice(skip, skip + ITEMS_POR_PAGINA);
    }
  } catch (error) {
    console.error("Error al recopilar datos de la billetera en el servidor:", error);
  }

  return (
    <BilleteraClient
      rol={rol}
      billetera={billetera}
      transacciones={transaccionesPaginadas}
      currentPage={currentPage}
      totalPages={totalPages}
      currentFiltro={currentFiltro}
    />
  );
}