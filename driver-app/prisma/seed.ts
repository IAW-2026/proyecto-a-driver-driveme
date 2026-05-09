import 'dotenv/config'
import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

async function main() {
  console.log('🌱 Empezando el sembrado de datos...')

  // 1. Limpiar datos existentes (orden inverso a las relaciones)
  await prisma.viaje.deleteMany()
  await prisma.vehiculo.deleteMany()
  await prisma.conductor.deleteMany()

  // 2. Crear un Conductor de prueba
  // El ID debe coincidir con un ID de usuario de Clerk si ya tenés uno, 
  // sino usá uno genérico para probar la base.
  const conductorVicky = await prisma.conductor.create({
    data: {
      id_conductor: 'user_vicky_test_123',
      nombre: 'Vicky',
      apellido: 'Ingeniería',
      licencia: 'ABC-12345',
      vehiculos: {
        create: {
          patente: 'AF123JK',
          marca: 'Toyota',
          modelo: 'Corolla',
          anio: 2023,
        }
      }
    },
    include: {
      vehiculos: true
    }
  })

  // 3. Crear un segundo conductor con un viaje ya realizado
  const conductorNacho = await prisma.conductor.create({
    data: {
      id_conductor: 'user_nacho_test_456',
      nombre: 'Ignacio',
      apellido: 'Dev',
      licencia: 'XYZ-98765',
      vehiculos: {
        create: {
          patente: 'AE999ZZ',
          marca: 'Ford',
          modelo: 'Focus',
          anio: 2021,
        }
      }
    },
    include: {
      vehiculos: true
    }
  })

  // 4. Crear un viaje de prueba para Nacho
  await prisma.viaje.create({
    data: {
      estado: 'FINALIZADO',
      precio: 4500.50,
      id_conductor: conductorNacho.id_conductor,
      id_vehiculo: conductorNacho.vehiculos[0].id_vehiculo,
    }
  })

  console.log('✅ Datos sembrados con éxito.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })