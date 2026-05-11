import "dotenv/config";
import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

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
      id_conductor: 'user_luciana_456',
      nombre: 'Luciana',
      apellido: 'González',
      licencia: 'LGO-789',
      disponible: true, // <-- Nace conectada
      vehiculos: {
        create: {
          patente: 'AGL-001',
          marca: 'Peugeot',
          modelo: '208',
          anio: 2024,
        }
      }
    },
    include: { vehiculos: true }
  })

  // Caso B: Conductora Nocturna y Online - Múltiples autos, algunos viajes cancelados.
  const conductorSofia = await prisma.conductor.create({
    data: {
      id_conductor: 'user_sofi_888',
      nombre: 'Sofía',
      apellido: 'Gómez',
      licencia: 'SGO-555',
      disponible: true, // <-- Nace conectada (tiene un viaje en curso)
      vehiculos: {
        create: [
          { patente: 'PKR-777', marca: 'Volkswagen', modelo: 'Golf', anio: 2021 },
          { patente: 'CAT-007', marca: 'Renault', modelo: 'Kangoo', anio: 2018 }
        ]
      }
    },
    include: { vehiculos: true }
  })

  // Caso C: El Novato y Offline - Recién registrado, tiene auto pero 0 viajes.
  const conductorLeo = await prisma.conductor.create({
    data: {
      id_conductor: 'user_leo_321',
      nombre: 'Leonardo',
      apellido: 'Paz',
      licencia: 'LPA-101',
      disponible: false, // <-- Nace desconectado
      vehiculos: {
        create: {
          patente: 'NEW-999',
          marca: 'Chevrolet',
          modelo: 'Onix',
          anio: 2023,
        }
      }
    },
    include: { vehiculos: true }
  })

  // Caso D: Conductor Inactivo - Borrado lógico (fecha_baja).
  const conductorLucas = await prisma.conductor.create({
    data: {
      id_conductor: 'user_lucas_404',
      nombre: 'Lucas',
      apellido: 'Testing',
      licencia: 'QAE-404',
      disponible: false, // <-- Desconectado y dado de baja
      fecha_baja: new Date(),
      vehiculos: {
        create: {
          patente: 'OLD-111',
          marca: 'Toyota',
          modelo: 'Etios',
          anio: 2015,
          fecha_baja: new Date()
        }
      }
    },
    include: { vehiculos: true }
  })

  /* ==========================================
     MOCK DE ADMINISTRADOR (Opcional)
     ==========================================
     Si modificaste tu schema.prisma para tener una tabla de Admins, 
     descomentá este bloque y ajustá los campos a tu modelo.
  */
  // await prisma.administrador.create({
  //   data: {
  //     id_admin: 'admin_master_001',
  //     email: 'tu.email.real@gmail.com',
  //     nombre: 'Admin',
  //     rol: 'SUPERADMIN'
  //   }
  // })

  console.log('🚗 Generando historial de viajes complejo...')

  const ahora = Date.now();
  const unDia = 86400000;

  // Viajes de Luciana
  await prisma.viaje.createMany({
    data: [
      { estado: 'FINALIZADO', precio: 4500.00, id_conductor: conductorLuciana.id_conductor, id_vehiculo: conductorLuciana.vehiculos[0].id_vehiculo, creado_en: new Date(ahora - unDia * 5) },
      { estado: 'FINALIZADO', precio: 3200.50, id_conductor: conductorLuciana.id_conductor, id_vehiculo: conductorLuciana.vehiculos[0].id_vehiculo, creado_en: new Date(ahora - unDia * 2) },
      { estado: 'FINALIZADO', precio: 8900.00, id_conductor: conductorLuciana.id_conductor, id_vehiculo: conductorLuciana.vehiculos[0].id_vehiculo, creado_en: new Date() },
    ]
  })

  // Viajes de Sofía (Usa sus dos autos, tiene cancelaciones y un viaje en curso)
  await prisma.viaje.createMany({
    data: [
      { estado: 'FINALIZADO', precio: 12000.00, id_conductor: conductorSofia.id_conductor, id_vehiculo: conductorSofia.vehiculos[0].id_vehiculo, creado_en: new Date(ahora - unDia * 10) },
      { estado: 'CANCELADO', precio: 0, id_conductor: conductorSofia.id_conductor, id_vehiculo: conductorSofia.vehiculos[1].id_vehiculo, creado_en: new Date(ahora - 3600000) },
      { estado: 'EN_CURSO', precio: 5600.00, id_conductor: conductorSofia.id_conductor, id_vehiculo: conductorSofia.vehiculos[0].id_vehiculo, creado_en: new Date() },
    ]
  })

  // Viajes de Lucas (Historial viejo, antes de ser dado de baja)
  await prisma.viaje.create({
    data: {
      estado: 'FINALIZADO',
      precio: 15500.00,
      id_conductor: conductorLucas.id_conductor,
      id_vehiculo: conductorLucas.vehiculos[0].id_vehiculo,
      creado_en: new Date('2025-10-01T10:00:00Z')
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