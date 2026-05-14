import "dotenv/config";
import { PrismaClient } from '../app/generated/prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Destruyendo base de datos anterior...')
  await prisma.viaje.deleteMany()
  await prisma.vehiculo.deleteMany()
  await prisma.conductor.deleteMany()
  // await prisma.administrador.deleteMany() // Descomentar si creaste esta tabla

  console.log('🌱 Sembrando el nuevo ecosistema de datos...')

  // Caso A: Conductora Activa y Online
  const conductorLuciana = await prisma.conductor.create({
    data: {
      id: 'user_luciana_456',
      nombre: 'Luciana',
      apellido: 'González',
      estado: 'ONLINE', // <-- Nace conectada
      vehiculos: {
        create: {
          patente: 'AGL-001',
          marca: 'Peugeot',
          modelo: '208',
          anio: 2024,
          color: 'Blanco'
        }
      }
    },
    include: { vehiculos: true }
  })

  // Caso B: Conductora Nocturna y Online - Múltiples autos, algunos viajes cancelados.
  const conductorSofia = await prisma.conductor.create({
    data: {
      id: 'user_sofi_888',
      nombre: 'Sofía',
      apellido: 'Gómez',
      estado: 'ONLINE', // <-- Nace conectada (tiene un viaje en curso)
      vehiculos: {
        create: [
          { patente: 'PKR-777', marca: 'Volkswagen', modelo: 'Golf', anio: 2021, color: 'Gris' },
          { patente: 'CAT-007', marca: 'Renault', modelo: 'Kangoo', anio: 2018, color: 'Blanco' }
        ]
      }
    },
    include: { vehiculos: true }
  })

  // Caso C: El Novato y Offline - Recién registrado, tiene auto pero 0 viajes.
  const conductorLeo = await prisma.conductor.create({
    data: {
      id: 'user_leo_321',
      nombre: 'Leonardo',
      apellido: 'Paz',
      estado: 'OFFLINE', // <-- Nace desconectado
      vehiculos: {
        create: {
          patente: 'NEW-999',
          marca: 'Chevrolet',
          modelo: 'Onix',
          anio: 2023,
          color: 'Azul'
        }
      }
    },
    include: { vehiculos: true }
  })

  // Caso D: Conductor Inactivo - Borrado lógico (fecha_baja).
  const conductorLucas = await prisma.conductor.create({
    data: {
      id: 'user_lucas_404',
      nombre: 'Lucas',
      apellido: 'Testing',
      estado: 'OFFLINE', // <-- Desconectado y dado de baja
      isActive: false,
      vehiculos: {
        create: {
          patente: 'OLD-111',
          marca: 'Toyota',
          modelo: 'Etios',
          anio: 2015,
          color: 'Gris',
          isActive: false
        }
      }
    },
    include: { vehiculos: true }
  })

  console.log('🚗 Generando historial de viajes complejo...')

  const ahora = Date.now();
  const unDia = 86400000;

  // Viajes de Luciana
  await prisma.viaje.createMany({
    data: [
      { id_solicitud: 'sol_1', id_pasajero: 'pas_1', metodo_pago: 'EFECTIVO', estado_actual: 'FINALIZADO', precio_final: 4500.00, id_conductor: conductorLuciana.id, id_vehiculo: conductorLuciana.vehiculos[0].id, tiempo_aceptado: new Date(ahora - unDia * 5) },
      { id_solicitud: 'sol_2', id_pasajero: 'pas_2', metodo_pago: 'TARJETA', estado_actual: 'FINALIZADO', precio_final: 3200.50, id_conductor: conductorLuciana.id, id_vehiculo: conductorLuciana.vehiculos[0].id, tiempo_aceptado: new Date(ahora - unDia * 2) },
      { id_solicitud: 'sol_3', id_pasajero: 'pas_3', metodo_pago: 'EFECTIVO', estado_actual: 'FINALIZADO', precio_final: 8900.00, id_conductor: conductorLuciana.id, id_vehiculo: conductorLuciana.vehiculos[0].id, tiempo_aceptado: new Date() },
    ]
  })

  // Viajes de Sofía (Usa sus dos autos, tiene cancelaciones y un viaje en curso)
  await prisma.viaje.createMany({
    data: [
      { id_solicitud: 'sol_4', id_pasajero: 'pas_4', metodo_pago: 'TARJETA', estado_actual: 'FINALIZADO', precio_final: 12000.00, id_conductor: conductorSofia.id, id_vehiculo: conductorSofia.vehiculos[0].id, tiempo_aceptado: new Date(ahora - unDia * 10) },
      { id_solicitud: 'sol_5', id_pasajero: 'pas_5', metodo_pago: 'EFECTIVO', estado_actual: 'CANCELADO_POR_CONDUCTOR', precio_final: 0, id_conductor: conductorSofia.id, id_vehiculo: conductorSofia.vehiculos[1].id, tiempo_aceptado: new Date(ahora - 3600000) },
      { id_solicitud: 'sol_6', id_pasajero: 'pas_6', metodo_pago: 'TARJETA', estado_actual: 'EN_CURSO', precio_final: 5600.00, id_conductor: conductorSofia.id, id_vehiculo: conductorSofia.vehiculos[0].id, tiempo_aceptado: new Date() },
    ]
  })

  // Viajes de Lucas (Historial viejo, antes de ser dado de baja)
  await prisma.viaje.create({
    data: {
      id_solicitud: 'sol_7', 
      id_pasajero: 'pas_7',
      metodo_pago: 'EFECTIVO',
      estado_actual: 'FINALIZADO',
      precio_final: 15500.00,
      id_conductor: conductorLucas.id,
      id_vehiculo: conductorLucas.vehiculos[0].id,
      tiempo_aceptado: new Date('2025-10-01T10:00:00Z')
    }
  })

  console.log('✅ Base de datos sembrada. Lista para estresar el frontend.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })