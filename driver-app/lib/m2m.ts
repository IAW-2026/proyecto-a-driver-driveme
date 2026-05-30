export function m2mHeaders(): HeadersInit {
  const key = process.env.INTERNAL_API_KEY;
  if (!key) {
    console.error(
      "[ERROR] INTERNAL_API_KEY no definida. Las llamadas M2M serán rechazadas por los otros servicios."
    );
  }
  return {
    "Content-Type": "application/json",
    ...(key ? { "x-api-key": key } : {}),
  };
}