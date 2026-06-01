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