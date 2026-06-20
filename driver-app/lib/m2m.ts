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
  const expectedKey = process.env.DRIVER_SERVICE_SECRET;
  const feedbackToken = process.env.FEEDBACK_SERVICE_SECRET;

  if (!expectedKey && !feedbackToken) {
    console.error('[ERROR] No hay tokens definidos en .env para validar M2M.');
    return false;
  }

  return (
    (!!apiKey && apiKey === expectedKey) ||
    (!!authHeader && (authHeader === `Bearer ${feedbackToken}` || authHeader === `Bearer ${expectedKey}`))
  );
}