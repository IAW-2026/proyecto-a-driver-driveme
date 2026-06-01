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
  await prisma.historialConexion.deleteMany()
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
      comentario_promedio: '¡Excelente conductora! Siempre llega a tiempo y el auto huele muy bien.',
      meta_diaria: 35000,
      fecha_ultima_liquidacion: new Date(Date.now() - (86400000 * 10)), // Hace 10 días (Puede liquidar)
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
      comentario_promedio: 'Maneja muy bien de noche, super recomendable y segura.',
      meta_diaria: 50000,
      fecha_ultima_liquidacion: new Date(Date.now() - (86400000 * 2)), // Hace 2 días (Bloqueada por límite de 7 días)
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
  const unMinuto = 60000; // Agregado para simular duraciones de viaje reales

  await prisma.historialConexion.createMany({
    data: [
      { id_conductor: conductorLuciana.id_conductor, estado: 'ONLINE', timestamp: new Date(ahora - (unaHora * 4)) },
      { id_conductor: conductorSofia.id_conductor, estado: 'ONLINE', timestamp: new Date(ahora - (unaHora * 7)) },
      { id_conductor: conductorMarcos.id_conductor, estado: 'ONLINE', timestamp: new Date(ahora - (unaHora * 6)) },
      { id_conductor: conductorMarcos.id_conductor, estado: 'OFFLINE', timestamp: new Date(ahora - (unaHora * 4)) },
      { id_conductor: conductorMarcos.id_conductor, estado: 'ONLINE', timestamp: new Date(ahora - (unaHora * 1)) },
      { id_conductor: conductorValentina.id_conductor, estado: 'ONLINE', timestamp: new Date(ahora - (unaHora * 2)) }
    ]
  });

  console.log('🚗 Generando historial de viajes complejo y detallado...')

  // Viajes de Luciana
  await prisma.viaje.createMany({
    data: [
      { 
        id_solicitud: 'sol_1', id_pasajero: 'pas_1', pasajero_nombre: 'Ignacio Romero', 
        metodo_pago: 'EFECTIVO', estado_actual: 'FINALIZADO', precio: 4500.00, precio_final: 4500.00, 
        id_conductor: conductorLuciana.id_conductor, id_vehiculo: conductorLuciana.vehiculos[0].id_vehiculo, 
        origen_direccion: 'Plaza Rivadavia, Bahía Blanca', origen_latitud: -38.7183, origen_longitud: -62.2663,
        destino_direccion: 'Terminal de Ómnibus, Bahía Blanca', destino_latitud: -38.7436, destino_longitud: -62.2475,
        tiempo_aceptado: new Date(ahora - unDia * 5),
        tiempo_comienzo: new Date(ahora - unDia * 5 + unMinuto * 4), // Empieza 4 mins después
        tiempo_completado: new Date(ahora - unDia * 5 + unMinuto * 22) // Tarda 18 mins de viaje
      },
      { 
        id_solicitud: 'sol_2', id_pasajero: 'pas_2', pasajero_nombre: 'Camila Sosa',
        metodo_pago: 'MERCADO_PAGO', estado_actual: 'FINALIZADO', precio: 3200.50, precio_final: 3200.50, 
        id_conductor: conductorLuciana.id_conductor, id_vehiculo: conductorLuciana.vehiculos[0].id_vehiculo, 
        origen_direccion: 'Parque de Mayo, Bahía Blanca', origen_latitud: -38.7025, origen_longitud: -62.2685,
        destino_direccion: 'UNS Av. Alem, Bahía Blanca', destino_latitud: -38.7058, destino_longitud: -62.2711,
        tiempo_aceptado: new Date(ahora - unDia * 2),
        tiempo_comienzo: new Date(ahora - unDia * 2 + unMinuto * 2),
        tiempo_completado: new Date(ahora - unDia * 2 + unMinuto * 10)
      },
      { 
        id_solicitud: 'sol_3', id_pasajero: 'pas_3', pasajero_nombre: 'Tomás Castro',
        metodo_pago: 'EFECTIVO', estado_actual: 'FINALIZADO', precio: 18900.00, precio_final: 18900.00, 
        id_conductor: conductorLuciana.id_conductor, id_vehiculo: conductorLuciana.vehiculos[0].id_vehiculo, 
        origen_direccion: 'Hospital Penna, Bahía Blanca', origen_latitud: -38.7112, origen_longitud: -62.2355,
        destino_direccion: 'Aeropuerto Comandante Espora, Bahía Blanca', destino_latitud: -38.7230, destino_longitud: -62.1550,
        tiempo_aceptado: new Date(ahora - (unaHora * 2)),
        tiempo_comienzo: new Date(ahora - (unaHora * 2) + unMinuto * 5),
        tiempo_completado: new Date(ahora - (unaHora * 2) + unMinuto * 35)
      },
    ]
  })

  // Viajes de Sofía
  await prisma.viaje.createMany({
    data: [
      { 
        id_solicitud: 'sol_4', id_pasajero: 'pas_4', pasajero_nombre: 'Laura Díaz',
        metodo_pago: 'MERCADO_PAGO', estado_actual: 'FINALIZADO', precio: 12000.00, precio_final: 12000.00, 
        id_conductor: conductorSofia.id_conductor, id_vehiculo: conductorSofia.vehiculos[0].id_vehiculo, 
        origen_direccion: 'Teatro Municipal, Bahía Blanca', origen_latitud: -38.7155, origen_longitud: -62.2635,
        destino_direccion: 'Barrio Patagonia, Bahía Blanca', destino_latitud: -38.6920, destino_longitud: -62.2250,
        tiempo_aceptado: new Date(ahora - unDia * 10),
        tiempo_comienzo: new Date(ahora - unDia * 10 + unMinuto * 3),
        tiempo_completado: new Date(ahora - unDia * 10 + unMinuto * 25)
      },
      { 
        // Este está cancelado, por lo que no tiene tiempo de finalización.
        id_solicitud: 'sol_5', id_pasajero: 'pas_5', pasajero_nombre: 'Esteban M.',
        metodo_pago: 'EFECTIVO', estado_actual: 'CANCELADO_POR_CONDUCTOR', precio: 0, precio_final: 0, 
        id_conductor: conductorSofia.id_conductor, id_vehiculo: conductorSofia.vehiculos[1].id_vehiculo, 
        origen_direccion: 'Paseo de las Esculturas, Bahía Blanca', origen_latitud: -38.7060, origen_longitud: -62.2590,
        destino_direccion: 'Plaza Rivadavia, Bahía Blanca', destino_latitud: -38.7183, destino_longitud: -62.2663,
        tiempo_aceptado: new Date(ahora - unaHora),
        tiempo_comienzo: null, // Lo canceló antes de buscar al pasajero
        tiempo_completado: null
      },
      { 
        // Este está en curso, tiene inicio pero no final.
        id_solicitud: 'sol_6', id_pasajero: 'pas_6', pasajero_nombre: 'Julieta Silva',
        metodo_pago: 'MERCADO_PAGO', estado_actual: 'EN_CURSO', precio: 5600.00, precio_final: 5600.00, 
        id_conductor: conductorSofia.id_conductor, id_vehiculo: conductorSofia.vehiculos[0].id_vehiculo, 
        origen_direccion: 'UNS Campus Palihue, Bahía Blanca', origen_latitud: -38.6912, origen_longitud: -62.2465,
        destino_direccion: 'Centro, Bahía Blanca', destino_latitud: -38.7170, destino_longitud: -62.2650,
        tiempo_aceptado: new Date(ahora - unMinuto * 12),
        tiempo_comienzo: new Date(ahora - unMinuto * 8),
        tiempo_completado: null 
      },
    ]
  })

  // Viaje de Lucas (Historial viejo)
  await prisma.viaje.create({
    data: {
      id_solicitud: 'sol_7', id_pasajero: 'pas_7', pasajero_nombre: 'Diego Fernández',
      metodo_pago: 'EFECTIVO', estado_actual: 'FINALIZADO', precio: 15500.00, precio_final: 15500.00,
      id_conductor: conductorLucas.id_conductor, id_vehiculo: conductorLucas.vehiculos[0].id_vehiculo,
      origen_direccion: 'Av. Colón 1500, Bahía Blanca', origen_latitud: -38.7290, origen_longitud: -62.2610,
      destino_direccion: 'Shopping Nine, Bahía Blanca', destino_latitud: -38.7010, destino_longitud: -62.2850,
      tiempo_aceptado: new Date('2025-10-01T10:00:00Z'),
      tiempo_comienzo: new Date('2025-10-01T10:05:00Z'),
      tiempo_completado: new Date('2025-10-01T10:25:00Z')
    }
  })

  // Viajes VIP de Valentina de HOY (Para llenar la meta diaria)
  await prisma.viaje.createMany({
    data: [
      { 
        id_solicitud: 'sol_8', id_pasajero: 'pas_8', pasajero_nombre: 'CEO Empresa X',
        metodo_pago: 'MERCADO_PAGO', estado_actual: 'FINALIZADO', precio: 35000.00, precio_final: 35000.00, 
        id_conductor: conductorValentina.id_conductor, id_vehiculo: conductorValentina.vehiculos[0].id_vehiculo, 
        origen_direccion: 'Hotel Argos, Bahía Blanca', origen_latitud: -38.7175, origen_longitud: -62.2615,
        destino_direccion: 'Parque Industrial, Bahía Blanca', destino_latitud: -38.7910, destino_longitud: -62.2840,
        tiempo_aceptado: new Date(ahora - (unaHora * 1.5)),
        tiempo_comienzo: new Date(ahora - (unaHora * 1.5) + unMinuto * 2),
        tiempo_completado: new Date(ahora - (unaHora * 1.5) + unMinuto * 40)
      },
      { 
        id_solicitud: 'sol_9', id_pasajero: 'pas_9', pasajero_nombre: 'Directorio Y',
        metodo_pago: 'EFECTIVO', estado_actual: 'FINALIZADO', precio: 42000.00, precio_final: 42000.00, 
        id_conductor: conductorValentina.id_conductor, id_vehiculo: conductorValentina.vehiculos[0].id_vehiculo, 
        origen_direccion: 'Parque Industrial, Bahía Blanca', origen_latitud: -38.7910, origen_longitud: -62.2840,
        destino_direccion: 'Aeropuerto Comandante Espora, Bahía Blanca', destino_latitud: -38.7230, destino_longitud: -62.1550,
        tiempo_aceptado: new Date(ahora - (unaHora * 0.5)),
        tiempo_comienzo: new Date(ahora - (unaHora * 0.5) + unMinuto * 3),
        tiempo_completado: new Date(ahora - (unaHora * 0.5) + unMinuto * 25)
      }
    ]
  })

  console.log('✅ Base de datos sembrada y lista con datos completos. ¡A probar esos Dashboards y Modales!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })