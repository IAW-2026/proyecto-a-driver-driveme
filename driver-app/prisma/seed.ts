import "dotenv/config";
import { PrismaClient } from '../app/generated/prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

const EVALUADOR_CLERK_ID = 'user_3EXZNT7fvqJ8A6bBXzyIagBH2s0K';

async function main() {
  console.log('🌱 Destruyendo ecosistema anterior (incluyendo historiales)...')
  await prisma.historialConexion.deleteMany()
  await prisma.viaje.deleteMany()
  await prisma.vehiculo.deleteMany()
  await prisma.conductor.deleteMany()

  console.log('🌱 Sembrando la nueva flota de datos...')

  // Caso Evaluador - Activo, con muchísimos datos para probar
  const conductorEvaluador = await prisma.conductor.create({
    data: {
      id_conductor: EVALUADOR_CLERK_ID,
      nombre: 'Evaluador',
      apellido: 'IAW',
      licencia: '20345678',
      estado: 'ONLINE',
      comentario_promedio: '¡Excelente conductor! Dashboard de prueba listo.',
      meta_diaria: 35000,
      fecha_ultima_liquidacion: new Date(Date.now() - (86400000 * 5)), // Hace 5 días
      vehiculos: {
        create: { patente: 'AF123BC', numero_poliza: 'POL-AF123BC-01', marca: 'Peugeot', modelo: '208', anio: 2024, color: 'Blanco' }
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
      licencia: '28555666',
      estado: 'ONLINE',
      comentario_promedio: 'Maneja muy bien de noche, super recomendable y segura.',
      meta_diaria: 50000,
      fecha_ultima_liquidacion: new Date(Date.now() - (86400000 * 2)),
      vehiculos: {
        create: [
          { patente: 'PKR777', numero_poliza: 'POL-PKR777-01', marca: 'Volkswagen', modelo: 'Golf', anio: 2021, color: 'Gris' },
          { patente: 'AA007ZZ', numero_poliza: 'POL-AA007ZZ-01', marca: 'Renault', modelo: 'Kangoo', anio: 2018, color: 'Blanco' }
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
      licencia: '35123456',
      estado: 'OFFLINE',
      meta_diaria: 15000,
      vehiculos: {
        create: { patente: 'AE999XX', numero_poliza: 'POL-AE999XX-01', marca: 'Chevrolet', modelo: 'Onix', anio: 2023, color: 'Azul' }
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
      licencia: '38999000',
      estado: 'OFFLINE',
      isActive: false,
      vehiculos: {
        create: { patente: 'OLD111', numero_poliza: 'POL-OLD111-01', marca: 'Toyota', modelo: 'Etios', anio: 2015, color: 'Gris', isActive: false }
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
      licencia: '31444777',
      estado: 'ONLINE',
      meta_diaria: 40000,
      vehiculos: {
        create: { patente: 'AG404YY', numero_poliza: 'POL-AG404YY-01', marca: 'Fiat', modelo: 'Cronos', anio: 2022, color: 'Rojo' }
      }
    },
    include: { vehiculos: true }
  })

  console.log('⏱️  Generando historiales de conexión (Horas Online)...')

  const ahora = Date.now();
  const unDia = 86400000;
  const unaHora = 3600000;
  const unMinuto = 60000;

  await prisma.historialConexion.createMany({
    data: [
      { id_conductor: conductorEvaluador.id_conductor, estado: 'ONLINE', timestamp: new Date(ahora - (unaHora * 5)) },
      { id_conductor: conductorEvaluador.id_conductor, estado: 'OFFLINE', timestamp: new Date(ahora - (unaHora * 1)) },
      { id_conductor: conductorEvaluador.id_conductor, estado: 'ONLINE', timestamp: new Date(ahora - (unMinuto * 30)) },
      { id_conductor: conductorSofia.id_conductor, estado: 'ONLINE', timestamp: new Date(ahora - (unaHora * 7)) },
      { id_conductor: conductorMarcos.id_conductor, estado: 'ONLINE', timestamp: new Date(ahora - (unaHora * 6)) },
      { id_conductor: conductorMarcos.id_conductor, estado: 'OFFLINE', timestamp: new Date(ahora - (unaHora * 4)) },
      { id_conductor: conductorMarcos.id_conductor, estado: 'ONLINE', timestamp: new Date(ahora - (unaHora * 1)) }
    ]
  });

  console.log('🚗 Generando historial masivo de viajes...')

  // Arrays de datos aleatorios para la generación masiva
  const pasajerosNombres = ['Ignacio Romero', 'Camila Sosa', 'Tomás Castro', 'Laura Díaz', 'Esteban M.', 'Julieta Silva', 'Diego Fernández', 'Martina Gómez', 'Facundo Herrera', 'Valentina Ruiz'];
  const ubicaciones = [
    { dir: 'Plaza Rivadavia, Bahía Blanca', lat: -38.7183, lng: -62.2663 },
    { dir: 'Terminal de Ómnibus, Bahía Blanca', lat: -38.7436, lng: -62.2475 },
    { dir: 'Parque de Mayo, Bahía Blanca', lat: -38.7025, lng: -62.2685 },
    { dir: 'UNS Av. Alem, Bahía Blanca', lat: -38.7058, lng: -62.2711 },
    { dir: 'Hospital Penna, Bahía Blanca', lat: -38.7112, lng: -62.2355 },
    { dir: 'Aeropuerto Comandante Espora, Bahía Blanca', lat: -38.7230, lng: -62.1550 },
    { dir: 'Teatro Municipal, Bahía Blanca', lat: -38.7155, lng: -62.2635 },
    { dir: 'Barrio Patagonia, Bahía Blanca', lat: -38.6920, lng: -62.2250 },
    { dir: 'Shopping Nine, Bahía Blanca', lat: -38.7010, lng: -62.2850 }
  ];

  const viajesMasivos: any[] = [];

  // Generar 25 viajes aleatorios finalizados para el Evaluador a lo largo de los últimos 7 días
  for (let i = 0; i < 25; i++) {
    const origen = ubicaciones[Math.floor(Math.random() * ubicaciones.length)];
    let destino = ubicaciones[Math.floor(Math.random() * ubicaciones.length)];
    while (destino.dir === origen.dir) {
      destino = ubicaciones[Math.floor(Math.random() * ubicaciones.length)];
    }

    const diasAtras = Math.floor(Math.random() * 7); // Entre 0 y 6 días atrás
    const horasAtras = Math.floor(Math.random() * 24);
    const fechaAceptado = new Date(ahora - (diasAtras * unDia) - (horasAtras * unaHora));
    const fechaComienzo = new Date(fechaAceptado.getTime() + (Math.floor(Math.random() * 5 + 1) * unMinuto)); // 1 a 6 mins despues
    const duracionViaje = Math.floor(Math.random() * 25 + 10); // 10 a 35 mins de viaje
    const fechaCompletado = new Date(fechaComienzo.getTime() + (duracionViaje * unMinuto));
    const precio = Math.floor(Math.random() * 15000 + 3000); // Entre 3000 y 18000

    viajesMasivos.push({
      id_solicitud: `sol_eval_${i}`,
      id_pasajero: `pas_${Math.floor(Math.random() * 100)}`,
      pasajero_nombre: pasajerosNombres[Math.floor(Math.random() * pasajerosNombres.length)],
      metodo_pago: Math.random() > 0.5 ? 'EFECTIVO' : 'MERCADO_PAGO',
      estado_actual: 'FINALIZADO',
      precio: precio,
      precio_final: precio,
      id_conductor: conductorEvaluador.id_conductor,
      id_vehiculo: conductorEvaluador.vehiculos[0].id_vehiculo,
      origen_direccion: origen.dir, origen_latitud: origen.lat, origen_longitud: origen.lng,
      destino_direccion: destino.dir, destino_latitud: destino.lat, destino_longitud: destino.lng,
      tiempo_aceptado: fechaAceptado,
      tiempo_comienzo: fechaComienzo,
      tiempo_completado: fechaCompletado
    });
  }

  // Agrego un par de viajes de evaluador en curso y cancelados para mostrar todos los estados
  viajesMasivos.push({
    id_solicitud: 'sol_eval_cancelado', id_pasajero: 'pas_xx', pasajero_nombre: 'Martina Gómez',
    metodo_pago: 'EFECTIVO', estado_actual: 'CANCELADO_POR_CONDUCTOR', precio: 0, precio_final: 0,
    id_conductor: conductorEvaluador.id_conductor, id_vehiculo: conductorEvaluador.vehiculos[0].id_vehiculo,
    origen_direccion: 'Plaza Rivadavia', origen_latitud: -38.7183, origen_longitud: -62.2663,
    destino_direccion: 'Terminal', destino_latitud: -38.7436, destino_longitud: -62.2475,
    tiempo_aceptado: new Date(ahora - (unaHora * 2)), tiempo_comienzo: null, tiempo_completado: null
  });

  viajesMasivos.push({
    id_solicitud: 'sol_eval_curso', id_pasajero: 'pas_yy', pasajero_nombre: 'Facundo Herrera',
    metodo_pago: 'MERCADO_PAGO', estado_actual: 'EN_CURSO', precio: 8500.0, precio_final: 8500.0,
    id_conductor: conductorEvaluador.id_conductor, id_vehiculo: conductorEvaluador.vehiculos[0].id_vehiculo,
    origen_direccion: 'Parque de Mayo', origen_latitud: -38.7025, origen_longitud: -62.2685,
    destino_direccion: 'Hospital Penna', destino_latitud: -38.7112, destino_longitud: -62.2355,
    tiempo_aceptado: new Date(ahora - unMinuto * 15), tiempo_comienzo: new Date(ahora - unMinuto * 10), tiempo_completado: null
  });

  // Viajes de Sofía y otros para rellenar la tabla administrativa
  viajesMasivos.push(
    {
      id_solicitud: 'sol_sofia_1', id_pasajero: 'pas_4', pasajero_nombre: 'Laura Díaz',
      metodo_pago: 'MERCADO_PAGO', estado_actual: 'FINALIZADO', precio: 12000.00, precio_final: 12000.00,
      id_conductor: conductorSofia.id_conductor, id_vehiculo: conductorSofia.vehiculos[0].id_vehiculo,
      origen_direccion: 'Teatro Municipal, Bahía Blanca', origen_latitud: -38.7155, origen_longitud: -62.2635,
      destino_direccion: 'Barrio Patagonia, Bahía Blanca', destino_latitud: -38.6920, destino_longitud: -62.2250,
      tiempo_aceptado: new Date(ahora - unDia * 10),
      tiempo_comienzo: new Date(ahora - unDia * 10 + unMinuto * 3),
      tiempo_completado: new Date(ahora - unDia * 10 + unMinuto * 25)
    },
    {
      id_solicitud: 'sol_lucas_1', id_pasajero: 'pas_7', pasajero_nombre: 'Diego Fernández',
      metodo_pago: 'EFECTIVO', estado_actual: 'FINALIZADO', precio: 15500.00, precio_final: 15500.00,
      id_conductor: conductorLucas.id_conductor, id_vehiculo: conductorLucas.vehiculos[0].id_vehiculo,
      origen_direccion: 'Av. Colón 1500, Bahía Blanca', origen_latitud: -38.7290, origen_longitud: -62.2610,
      destino_direccion: 'Shopping Nine, Bahía Blanca', destino_latitud: -38.7010, destino_longitud: -62.2850,
      tiempo_aceptado: new Date('2025-10-01T10:00:00Z'),
      tiempo_comienzo: new Date('2025-10-01T10:05:00Z'),
      tiempo_completado: new Date('2025-10-01T10:25:00Z')
    }
  );

  // Insertar todos los viajes generados
  await prisma.viaje.createMany({ data: viajesMasivos });

  console.log('✅ Base de datos sembrada y lista con datos masivos. ¡A probar esos Dashboards y Modales!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })