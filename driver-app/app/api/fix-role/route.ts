import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: "No estás logueado. Inicia sesión en la app primero." }, { status: 401 });
  }

  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role: "driver" },
    });
    
    return NextResponse.json({ 
      success: true, 
      message: "¡Rol 'driver' asignado exitosamente! Cierra esta pestaña y vuelve a intentar enviar la reseña." 
    });
  } catch (error) {
    return NextResponse.json({ error: "Ocurrió un error al intentar actualizar el rol", detalles: String(error) }, { status: 500 });
  }
}
