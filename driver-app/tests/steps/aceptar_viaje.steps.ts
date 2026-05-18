import 'dotenv/config';
import { Given, When, Then, BeforeAll, AfterAll } from '@cucumber/cucumber';
import { request, APIRequestContext, expect } from '@playwright/test';
import { PrismaClient } from '../../app/generated/prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

let apiContext: APIRequestContext;
let response: any;
let prisma: PrismaClient;

// Almacén temporal de datos para la prueba
const testData = {
  id_solicitud: '',
  id_conductor: '',
  id_pasajero: 'pas_test_456',
  id_vehiculo: 'veh_test_123'
};

BeforeAll(async () => {
  // Inicializar cliente HTTP de Playwright
  apiContext = await request.newContext({
    baseURL: 'http://localhost:3000',
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
      // NOTA SOBRE CLERK: 
      // Para pruebas E2E/API reales, se suele usar un token de prueba de Clerk (Clerk Testing Token)
      // o se inyecta un mock en el middleware. Playwright enviará este header a Next.js.
      'Authorization': `Bearer ${process.env.CLERK_TEST_TOKEN || 'test-jwt-token'}`,
    }
  });

  // Conexión directa a la BD de pruebas para preparar datos y verificar aserciones
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL no está definida");
  
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
});

AfterAll(async () => {
  // Limpieza de datos (Teardown)
  if (testData.id_solicitud) {
    await prisma.viaje.deleteMany({ where: { id_solicitud: testData.id_solicitud } });
  }
  if (testData.id_conductor) {
    await prisma.vehiculo.deleteMany({ where: { id_conductor: testData.id_conductor } });
    await prisma.conductor.deleteMany({ where: { id_conductor: testData.id_conductor } });
  }
  await prisma.$disconnect();
  await apiContext.dispose();
});

Given('un conductor autenticado con ID {string}', async (id_conductor: string) => {
  testData.id_conductor = id_conductor;
  
  // 1. Asegurarnos de que el conductor existe (para la clave foránea)
  await prisma.conductor.upsert({
    where: { id_conductor },
    update: {},
    create: {
      id_conductor,
      nombre: 'Test',
      apellido: 'Driver',
      licencia: 'LIC-TEST',
      estado: 'ONLINE'
    }
  });

  // 2. Asegurarnos de que su vehículo existe
  await prisma.vehiculo.upsert({
    where: { patente: 'TEST-000' },
    update: {},
    create: {
      id_vehiculo: testData.id_vehiculo,
      id_conductor: id_conductor,
      patente: 'TEST-000',
      marca: 'Test',
      modelo: 'Auto',
      anio: 2024,
      color: 'Gris'
    }
  });
});

Given('una solicitud de viaje pendiente con ID {string}', async (id_solicitud: string) => {
  testData.id_solicitud = id_solicitud;
  // Garantizar que la base de datos no tenga un viaje con ese ID (estado pendiente)
  await prisma.viaje.deleteMany({
    where: { id_solicitud: id_solicitud }
  });
});

Given('una solicitud de viaje con ID {string} que ya ha sido aceptada previamente', async (id_solicitud: string) => {
  testData.id_solicitud = id_solicitud;
  
  // Para que el constraint falle, pre-insertamos un viaje competidor
  const competidorId = 'cond_competencia_999';
  
  await prisma.conductor.upsert({
    where: { id_conductor: competidorId },
    update: {},
    create: { id_conductor: competidorId, nombre: 'Rival', apellido: 'Driver', licencia: 'LIC-RIVAL', estado: 'ONLINE' }
  });

  await prisma.viaje.upsert({
    where: { id_solicitud: id_solicitud },
    update: {},
    create: {
      id_solicitud: id_solicitud,
      id_conductor: competidorId,
      id_pasajero: testData.id_pasajero,
      id_vehiculo: testData.id_vehiculo,
      estado_actual: 'ACEPTADO',
      metodo_pago: 'EFECTIVO',
      precio: 4500,
      precio_final: 4500
    }
  });
});

When('el conductor envía una petición POST a {string} con los datos del viaje', async (endpoint: string) => {
  response = await apiContext.post(endpoint, {
    data: {
      id_solicitud: testData.id_solicitud,
      id_conductor: testData.id_conductor,
      id_pasajero: testData.id_pasajero,
      id_vehiculo: testData.id_vehiculo,
      latitud_actual: -38.7183,
      longitud_actual: -62.2664,
      metodo_pago: 'EFECTIVO',
      precio_estimado: 4500.00
    },
    headers: {
      'x-test-driver-id': testData.id_conductor
    }
  });
});

Then('la respuesta debe tener el código HTTP {int}', async (statusCode: number) => {
  expect(response.status()).toBe(statusCode);
});

Then('la respuesta debe indicar que la operación fue exitosa', async () => {
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.data.estado_actual).toBe('ACEPTADO');
});

Then('el viaje debe quedar registrado en la base de datos con estado {string}', async (estado: string) => {
  const viajeEnBD = await prisma.viaje.findUnique({
    where: { id_solicitud: testData.id_solicitud }
  });
  
  expect(viajeEnBD).not.toBeNull();
  expect(viajeEnBD?.estado_actual).toBe(estado);
  expect(viajeEnBD?.id_conductor).toBe(testData.id_conductor);
});

Then('el mensaje de error debe indicar un conflicto de unicidad', async () => {
  const body = await response.json();
  expect(body.success).toBe(false);
  expect(body.error.code).toBe('CONFLICT');
});
