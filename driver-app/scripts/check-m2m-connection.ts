import 'dotenv/config';
import { m2mHeaders } from '../lib/m2m';

async function checkConnection() {
  const paymentsUrl = process.env.PAYMENTS_APP_URL;
  if (!paymentsUrl) {
    console.error("❌ Error: PAYMENTS_APP_URL no está definido en las variables de entorno.");
    process.exit(1);
  }

  console.log(`🔍 Verificando conexión a Payments App: ${paymentsUrl}...`);

  try {
    // Le pegamos a un endpoint con Auth M2M enviando un body vacío.
    // El objetivo es validar que el servidor responde (no hay timeout/refused)
    // y que no nos rechaza por error de autenticación (401/403).
    const res = await fetch(`${paymentsUrl}/api/pagos/transacciones`, {
      method: "PUT",
      headers: m2mHeaders(),
      body: JSON.stringify({}),
    });

    if (res.status === 401 || res.status === 403) {
      console.error(`❌ Error de Autenticación M2M (Status: ${res.status}). Revisa tu DRIVER_SERVICE_SECRET.`);
      process.exit(1);
    }

    // 400 Bad Request es un caso de éxito para esta prueba de conexión (ya que mandamos body vacío)
    if (res.ok || res.status === 400 || res.status === 500) {
      console.log(`✅ Conexión M2M exitosa!`);
      console.log(`   El servidor respondió con código ${res.status}.`);
      console.log(`   Esto indica que la Payments App está corriendo y nuestro token M2M es válido.`);
    } else {
      console.log(`⚠️ Conexión realizada, pero código inesperado: ${res.status}`);
    }

  } catch (error: any) {
    console.error(`❌ Falló la conexión con Payments App. Asegurate de que el servidor esté corriendo.`);
    console.error(`Detalle: ${error.message}`);
    process.exit(1);
  }
}

checkConnection();
