export function m2mHeaders(targetApp?: 'rider' | 'payments' | 'feedback'): HeadersInit {
  let token = process.env.DRIVER_SERVICE_SECRET;

  if (targetApp === 'rider' && process.env.RIDER_SERVICE_SECRET) {
    token = process.env.RIDER_SERVICE_SECRET;
  } else if (targetApp === 'payments' && process.env.PAYMENTS_SERVICE_SECRET) {
    token = process.env.PAYMENTS_SERVICE_SECRET;
  } else if (targetApp === 'feedback' && process.env.FEEDBACK_SERVICE_SECRET) {
    token = process.env.FEEDBACK_SERVICE_SECRET;
  }

  if (!token) {
    console.error(
      `[ERROR] Token M2M no definido para ${targetApp || 'interno'}. Las llamadas M2M podrían ser rechazadas.`
    );
  }

  return {
    "Content-Type": "application/json",
    ...(token ? { "x-api-key": token } : {}),
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