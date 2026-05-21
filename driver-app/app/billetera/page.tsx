import { redirect } from "next/navigation";
import { getSessionData } from "@/lib/getSessionData";
import BilleteraClient from "./BilleteraClient";

export default async function BilleteraPage() {
  const { userId, rol } = await getSessionData();

  if (rol === "CONDUCTOR_NUEVO") redirect("/");

  return <BilleteraClient conductorId={userId} rol={rol} />;
}
