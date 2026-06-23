// app/billetera/page.tsx
import { redirect } from "next/navigation";
import { m2mHeaders } from "@/lib/m2m";
import { getSessionData } from "@/lib/getSessionData";
import { checkActiveRideRedirect } from "@/lib/checkActiveRide";
import BilleteraClient from "./BilleteraClient";

export const metadata = {
  title: "Mi Billetera — DriveMe Conductores",
  description: "Historial de transacciones, liquidaciones y estado de ganancias.",
};

export default async function BilleteraPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filtro?: string }>;
}) {
  const { userId, rol, conductorData } = await getSessionData();
  await checkActiveRideRedirect(conductorData);
  if (rol === "CONDUCTOR_NUEVO" || rol === "ADMIN") {
    redirect("/");
  }

  const resolvedParams = await searchParams;
  const currentPage = Number(resolvedParams.page) || 1;
  const currentFiltro = resolvedParams.filtro || "TODOS";
  const ITEMS_POR_PAGINA = 10;
  const skip = (currentPage - 1) * ITEMS_POR_PAGINA;

  const baseUrl = process.env.PAYMENTS_APP_URL;
  const headers = m2mHeaders('payments');

  let billetera = null;
  let transaccionesPaginadas: any[] = [];
  let totalPages = 0;

  try {
    // Query param para filtro de estado_liquidacion (solo si no es TODOS)
    const filtroQuery =
      currentFiltro !== "TODOS" ? `?estado_liquidacion=${currentFiltro}` : "";

    // Consultar en paralelo billetera (§E) y transacciones (§C)
    const [resBilletera, resTxns] = await Promise.all([
      fetch(`${baseUrl}/api/pagos/liquidaciones`, { headers, cache: "no-store" }),
      fetch(`${baseUrl}/api/pagos/transacciones${filtroQuery}`, {
        headers,
        cache: "no-store",
      }),
    ]);

    if (resBilletera.ok) {
      billetera = await resBilletera.json();
    }

    if (resTxns.ok) {
      const dataTxns = await resTxns.json();
      // El contrato C devuelve un array directamente
      const txnsArray = Array.isArray(dataTxns) ? dataTxns : [];
      totalPages = Math.ceil(txnsArray.length / ITEMS_POR_PAGINA);
      transaccionesPaginadas = txnsArray.slice(skip, skip + ITEMS_POR_PAGINA);
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