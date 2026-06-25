import 'dotenv/config';
import { m2mHeaders } from '../lib/m2m';

async function checkConnection() {
  const paymentsUrl = process.env.PAYMENTS_APP_URL;
  if (!paymentsUrl) {
    console.error("❌ Error: PAYMENTS_APP_URL no está definido en las variables de entorno.");
    process.exit(1);
  }

  console.log(`🔍 Verificando conexión a Payments App: ${paymentsUrl}...\n`);

  const metodos = ["POST", "PUT", "PATCH"];
  let todoOk = true;

  for (const metodo of metodos) {
    console.log(` Probando método ${metodo}...`);
    try {
      const res = await fetch(`${paymentsUrl}/api/pagos/transacciones`, {
        method: metodo,
        headers: m2mHeaders(),
        body: JSON.stringify({}),
      });

      if (res.status === 401 || res.status === 403) {
        console.error(`   ❌ [FAIL] Error de Autenticación M2M (Status: ${res.status}). La app de pagos rechazó el DRIVER_SERVICE_SECRET para el método ${metodo}.`);
        todoOk = false;
      } else if (res.ok || res.status === 400 || res.status === 500) {
        console.log(`   ✅ [OK] Conexión M2M exitosa (Status: ${res.status}). El token fue aceptado para el método ${metodo}.`);
      } else {
        console.log(`   ⚠️ [WARNING] Status inesperado: ${res.status}`);
      }
    } catch (error: any) {
      console.error(`   ❌ Falló la red. Detalle: ${error.message}`);
      todoOk = false;
    }
  }

  if (todoOk) {
    console.log(`\n🎉 ¡Todas las pruebas M2M fueron exitosas! La Payments App está alineada con el contrato.`);
  } else {
    console.log(`\n🚨 ATENCIÓN: Hubo errores. Es posible que Payments App aún no haya implementado el nuevo contrato para todos los métodos.`);
  }
}

checkConnection();
