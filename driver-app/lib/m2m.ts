export function m2mHeaders(targetApp?: 'rider' | 'payments' | 'feedback'): HeadersInit {
  let token = process.env.INTERNAL_API_KEY;

  if (targetApp === 'rider' && process.env.RIDER_APP_TOKEN) {
    token = process.env.RIDER_APP_TOKEN;
  } else if (targetApp === 'payments' && process.env.PAYMENTS_APP_TOKEN) {
    token = process.env.PAYMENTS_APP_TOKEN;
  } else if (targetApp === 'feedback' && process.env.FEEDBACK_APP_TOKEN) {
    token = process.env.FEEDBACK_APP_TOKEN;
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
  const expectedKey = process.env.INTERNAL_API_KEY;
  const feedbackToken = process.env.FEEDBACK_APP_TOKEN;

  if (!expectedKey && !feedbackToken) {
    console.error('[ERROR] No hay tokens definidos en .env para validar M2M.');
    return false;
  }

  return (
    (!!apiKey && apiKey === expectedKey) ||
    (!!authHeader && (authHeader === `Bearer ${feedbackToken}` || authHeader === `Bearer ${expectedKey}`))
  );
}