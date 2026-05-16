import "dotenv/config";
import { PrismaClient } from '../app/generated/prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Destruyendo ecosistema anterior (incluyendo historiales)...')
  await prisma.historialConexion.deleteMany() // <-- ¡NUEVA TABLA!
  await prisma.viaje.deleteMany()
  await prisma.vehiculo.deleteMany()
  await prisma.conductor.deleteMany()

  console.log('🌱 Sembrando la nueva flota de datos...')

  // Caso A: Luciana - Activa, meta estándar.
  const conductorLuciana = await prisma.conductor.create({
    data: {
      id_conductor: 'user_luciana_456',
      nombre: 'Luciana',
      apellido: 'González',
      licencia: 'LIC-LUCIANA',
      estado: 'ONLINE',
      meta_diaria: 35000, // <-- ¡NUEVA COLUMNA!
      vehiculos: {
        create: { patente: 'AGL-001', marca: 'Peugeot', modelo: '208', anio: 2024, color: 'Blanco' }
      }
    },
    include: { vehiculos: true }
  })

  // Caso B: Sofía - Nocturna, meta alta, múltiples autos.
  const conductorSofia = await prisma.conductor.create({
    data: {
      id_conductor: 'user_sofi_888',
      nombre: 'Sofía',
      apellido: 'Gómez',
      licencia: 'LIC-SOFIA',
      estado: 'ONLINE',
      meta_diaria: 50000,
      vehiculos: {
        create: [
          { patente: 'PKR-777', marca: 'Volkswagen', modelo: 'Golf', anio: 2021, color: 'Gris' },
          { patente: 'CAT-007', marca: 'Renault', modelo: 'Kangoo', anio: 2018, color: 'Blanco' }
        ]
      }
    },
    include: { vehiculos: true }
  })

  // Caso C: Leo - El Novato (Offline, meta baja, 0 viajes)
  const conductorLeo = await prisma.conductor.create({
    data: {
      id_conductor: 'user_leo_321',
      nombre: 'Leonardo',
      apellido: 'Paz',
      licencia: 'LIC-LEO',
      estado: 'OFFLINE',
      meta_diaria: 15000,
      vehiculos: {
        create: { patente: 'NEW-999', marca: 'Chevrolet', modelo: 'Onix', anio: 2023, color: 'Azul' }
      }
    },
    include: { vehiculos: true }
  })

  // Caso D: Lucas - Borrado lógico (Inactivo)
  const conductorLucas = await prisma.conductor.create({
    data: {
      id_conductor: 'user_lucas_404',
      nombre: 'Lucas',
      apellido: 'Testing',
      licencia: 'LIC-LUCAS',
      estado: 'OFFLINE',
      isActive: false,
      vehiculos: {
        create: { patente: 'OLD-111', marca: 'Toyota', modelo: 'Etios', anio: 2015, color: 'Gris', isActive: false }
      }
    },
    include: { vehiculos: true }
  })

  // Caso E: Marcos - El Intermitente (Prueba matemática de horas)
  const conductorMarcos = await prisma.conductor.create({
    data: {
      id_conductor: 'user_marcos_777',
      nombre: 'Marcos',
      apellido: 'Ruiz',
      licencia: 'LIC-MARCOS',
      estado: 'ONLINE',
      meta_diaria: 40000,
      vehiculos: {
        create: { patente: 'INT-404', marca: 'Fiat', modelo: 'Cronos', anio: 2022, color: 'Rojo' }
      }
    },
    include: { vehiculos: true }
  })

  // Caso F: Valentina - VIP Alta Gama (Para reventar la meta de ingresos hoy)
  const conductorValentina = await prisma.conductor.create({
    data: {
      id_conductor: 'user_vale_999',
      nombre: 'Valentina',
      apellido: 'Vip',
      licencia: 'LIC-VALE',
      estado: 'ONLINE',
      meta_diaria: 80000,
      vehiculos: {
        create: { patente: 'VIP-001', marca: 'Audi', modelo: 'A4', anio: 2025, color: 'Negro' }
      }
    },
    include: { vehiculos: true }
  })

  console.log('⏱️  Generando historiales de conexión (Horas Online de hoy)...')

  const ahora = Date.now();
  const unDia = 86400000;
  const unaHora = 3600000;

  await prisma.historialConexion.createMany({
    data: [
      // Luciana: Se conectó hace 4 horas y sigue online
      { id_conductor: conductorLuciana.id_conductor, estado: 'ONLINE', timestamp: new Date(ahora - (unaHora * 4)) },

      // Sofía: Se conectó hace 7 horas
      { id_conductor: conductorSofia.id_conductor, estado: 'ONLINE', timestamp: new Date(ahora - (unaHora * 7)) },

      // Marcos (El intermitente): Se conectó hace 6h, desconectó hace 4h, volvió hace 1h. (Total: 3 horas)
      { id_conductor: conductorMarcos.id_conductor, estado: 'ONLINE', timestamp: new Date(ahora - (unaHora * 6)) },
      { id_conductor: conductorMarcos.id_conductor, estado: 'OFFLINE', timestamp: new Date(ahora - (unaHora * 4)) },
      { id_conductor: conductorMarcos.id_conductor, estado: 'ONLINE', timestamp: new Date(ahora - (unaHora * 1)) },

      // Valentina: Se conectó hace 2 horas
      { id_conductor: conductorValentina.id_conductor, estado: 'ONLINE', timestamp: new Date(ahora - (unaHora * 2)) }
    ]
  });

  console.log('🚗 Generando historial de viajes complejo...')

  // Viajes de Luciana
  await prisma.viaje.createMany({
    data: [
      { id_solicitud: 'sol_1', id_pasajero: 'pas_1', metodo_pago: 'EFECTIVO', estado_actual: 'FINALIZADO', precio: 4500.00, precio_final: 4500.00, id_conductor: conductorLuciana.id_conductor, id_vehiculo: conductorLuciana.vehiculos[0].id_vehiculo, tiempo_aceptado: new Date(ahora - unDia * 5) },
      { id_solicitud: 'sol_2', id_pasajero: 'pas_2', metodo_pago: 'TARJETA', estado_actual: 'FINALIZADO', precio: 3200.50, precio_final: 3200.50, id_conductor: conductorLuciana.id_conductor, id_vehiculo: conductorLuciana.vehiculos[0].id_vehiculo, tiempo_aceptado: new Date(ahora - unDia * 2) },
      // Viaje de HOY (suma a la barra)
      { id_solicitud: 'sol_3', id_pasajero: 'pas_3', metodo_pago: 'EFECTIVO', estado_actual: 'FINALIZADO', precio: 18900.00, precio_final: 18900.00, id_conductor: conductorLuciana.id_conductor, id_vehiculo: conductorLuciana.vehiculos[0].id_vehiculo, tiempo_aceptado: new Date(ahora - (unaHora * 2)) },
    ]
  })

  // Viajes de Sofía
  await prisma.viaje.createMany({
    data: [
      { id_solicitud: 'sol_4', id_pasajero: 'pas_4', metodo_pago: 'TARJETA', estado_actual: 'FINALIZADO', precio: 12000.00, precio_final: 12000.00, id_conductor: conductorSofia.id_conductor, id_vehiculo: conductorSofia.vehiculos[0].id_vehiculo, tiempo_aceptado: new Date(ahora - unDia * 10) },
      { id_solicitud: 'sol_5', id_pasajero: 'pas_5', metodo_pago: 'EFECTIVO', estado_actual: 'CANCELADO_POR_CONDUCTOR', precio: 0, precio_final: 0, id_conductor: conductorSofia.id_conductor, id_vehiculo: conductorSofia.vehiculos[1].id_vehiculo, tiempo_aceptado: new Date(ahora - 3600000) },
      { id_solicitud: 'sol_6', id_pasajero: 'pas_6', metodo_pago: 'TARJETA', estado_actual: 'EN_CURSO', precio: 5600.00, precio_final: 5600.00, id_conductor: conductorSofia.id_conductor, id_vehiculo: conductorSofia.vehiculos[0].id_vehiculo, tiempo_aceptado: new Date() },
    ]
  })

  // Viaje de Lucas (Historial viejo)
  await prisma.viaje.create({
    data: {
      id_solicitud: 'sol_7',
      id_pasajero: 'pas_7',
      metodo_pago: 'EFECTIVO',
      estado_actual: 'FINALIZADO',
      precio: 15500.00,
      precio_final: 15500.00,
      id_conductor: conductorLucas.id_conductor,
      id_vehiculo: conductorLucas.vehiculos[0].id_vehiculo,
      tiempo_aceptado: new Date('2025-10-01T10:00:00Z')
    }
  })

  // Viajes VIP de Valentina de HOY (Para llenar la meta diaria)
  await prisma.viaje.createMany({
    data: [
      { id_solicitud: 'sol_8', id_pasajero: 'pas_8', metodo_pago: 'TARJETA', estado_actual: 'FINALIZADO', precio: 35000.00, precio_final: 35000.00, id_conductor: conductorValentina.id_conductor, id_vehiculo: conductorValentina.vehiculos[0].id_vehiculo, tiempo_aceptado: new Date(ahora - (unaHora * 1.5)) },
      { id_solicitud: 'sol_9', id_pasajero: 'pas_9', metodo_pago: 'EFECTIVO', estado_actual: 'FINALIZADO', precio: 42000.00, precio_final: 42000.00, id_conductor: conductorValentina.id_conductor, id_vehiculo: conductorValentina.vehiculos[0].id_vehiculo, tiempo_aceptado: new Date(ahora - (unaHora * 0.5)) }
    ]
  })

  console.log('✅ Base de datos sembrada y lista. ¡A probar esos Dashboards!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })