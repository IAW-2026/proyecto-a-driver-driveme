import { auth } from "@clerk/nextjs/server";

/**
 * Headers M2M: siempre envía DRIVER_SERVICE_SECRET (el secret propio de la Driver App).
 * Según la spec: "Cada app que realiza una llamada manda SU PROPIO secret."
 */
export function m2mHeaders(): HeadersInit {
  const token = process.env.DRIVER_SERVICE_SECRET;

  if (!token) {
    console.error(
      '[ERROR] DRIVER_SERVICE_SECRET no definido. Las llamadas M2M serán rechazadas.'
    );
  }

  return {
    "Content-Type": "application/json",
    ...(token ? { 
      "x-api-key": token,
      "Authorization": `Bearer ${token}` 
    } : {}),
  };
}

/**
 * Headers con Clerk JWT del usuario autenticado.
 * Para endpoints de Payments que requieren identificación del usuario (spec C, D, E).
 */
export async function clerkAuthHeaders(): Promise<HeadersInit> {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    console.error('[ERROR] No se pudo obtener el Clerk JWT. El usuario podría no estar autenticado.');
  }

  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };
}

export function validateM2M(request: Request): boolean {
  // Extraemos el token tal cual lo indica la especificación (reemplazo de Bearer case-insensitive)
  const token =
    request.headers.get("x-api-key") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  // Lista de los secretos de las apps/servicios que tienen permiso
  const validTokens = [
    process.env.INTERNAL_API_KEY,
    process.env.DRIVER_SERVICE_SECRET,
    process.env.RIDER_SERVICE_SECRET,
    process.env.PAYMENTS_SERVICE_SECRET,
    process.env.FEEDBACK_SERVICE_SECRET,
  ].filter(Boolean);

  if (validTokens.length === 0) {
    console.error('[M2M] No hay ningún service secret definido en .env. Rechazando request.');
    return false;
  }

  if (token && validTokens.includes(token)) {
    return true;
  }

  // Si llegamos acá, la validación falló
  console.warn(`[M2M] Validación fallida. Token recibido: ${!!token}`);
  return false;
}

export function validateAdminM2M(request: Request, source: 'control-plane' | 'analytics'): boolean {
  const token =
    request.headers.get("x-api-key") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  
  let expectedKey = '';
  if (source === 'control-plane') expectedKey = process.env.CONTROL_PLANE_SECRET || '';
  if (source === 'analytics') expectedKey = process.env.ANALYTICS_DASHBOARD_SECRET || '';

  if (!expectedKey) {
    console.error(`[ERROR] No hay token definido en .env para validar M2M desde ${source}.`);
    return false;
  }

  return !!token && token === expectedKey;
}