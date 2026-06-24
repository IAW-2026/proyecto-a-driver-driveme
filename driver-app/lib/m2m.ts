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
  const apiKey = request.headers.get('x-api-key');
  const authHeader = request.headers.get('authorization');

  // Todos los secrets de servicios conocidos que podrían llamar a esta app
  const knownSecrets: { name: string; value: string | undefined }[] = [
    { name: 'DRIVER_SERVICE_SECRET',  value: process.env.DRIVER_SERVICE_SECRET },
    { name: 'RIDER_SERVICE_SECRET',   value: process.env.RIDER_SERVICE_SECRET },
    { name: 'PAYMENTS_SERVICE_SECRET', value: process.env.PAYMENTS_SERVICE_SECRET },
    { name: 'FEEDBACK_SERVICE_SECRET', value: process.env.FEEDBACK_SERVICE_SECRET },
  ];

  const definedSecrets = knownSecrets.filter((s) => !!s.value);

  if (definedSecrets.length === 0) {
    console.error('[M2M] No hay ningún service secret definido en .env. Rechazando request.');
    return false;
  }

  // Validar x-api-key contra cualquier secret conocido
  if (apiKey) {
    const match = definedSecrets.find((s) => s.value === apiKey);
    if (match) return true;
  }

  // Validar Authorization: Bearer <token> contra cualquier secret conocido
  if (authHeader?.startsWith('Bearer ')) {
    const bearerToken = authHeader.slice(7);
    const match = definedSecrets.find((s) => s.value === bearerToken);
    if (match) return true;
  }

  // Si llegamos acá, la validación falló
  console.warn(
    `[M2M] Validación fallida. ` +
    `x-api-key presente: ${!!apiKey}, Authorization presente: ${!!authHeader}. ` +
    `Secrets definidos: [${definedSecrets.map((s) => s.name).join(', ')}]`
  );
  return false;
}

export function validateAdminM2M(request: Request, source: 'control-plane' | 'analytics'): boolean {
  const apiKey = request.headers.get('x-api-key');
  const authHeader = request.headers.get('authorization');
  
  let expectedKey = '';
  if (source === 'control-plane') expectedKey = process.env.CONTROL_PLANE_SECRET || '';
  if (source === 'analytics') expectedKey = process.env.ANALYTICS_DASHBOARD_SECRET || '';

  if (!expectedKey) {
    console.error(`[ERROR] No hay token definido en .env para validar M2M desde ${source}.`);
    return false;
  }

  return (
    (!!apiKey && apiKey === expectedKey) ||
    (!!authHeader && authHeader === `Bearer ${expectedKey}`)
  );
}