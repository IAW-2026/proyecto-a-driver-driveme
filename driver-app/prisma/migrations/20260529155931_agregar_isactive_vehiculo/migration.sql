/*
  Warnings:

  - A unique constraint covering the columns `[id_solicitud]` on the table `Viaje` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "EstadoConductor" AS ENUM ('OFFLINE', 'ONLINE', 'OCUPADO');

-- CreateEnum
CREATE TYPE "EstadoViaje" AS ENUM ('ACEPTADO', 'EN_CURSO', 'FINALIZADO', 'CANCELADO_POR_CONDUCTOR');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'MERCADO_PAGO');

-- AlterTable
ALTER TABLE "Conductor" ADD COLUMN     "calificacion_promedio" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
ADD COLUMN     "estado" "EstadoConductor" NOT NULL DEFAULT 'OFFLINE',
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "latitud_actual" DOUBLE PRECISION,
ADD COLUMN     "longitud_actual" DOUBLE PRECISION,
ADD COLUMN     "meta_diaria" INTEGER NOT NULL DEFAULT 30000;

-- AlterTable
ALTER TABLE "Vehiculo" ADD COLUMN     "color" TEXT NOT NULL DEFAULT 'No especificado',
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Viaje" ADD COLUMN     "destino_direccion" TEXT,
ADD COLUMN     "destino_latitud" DOUBLE PRECISION,
ADD COLUMN     "destino_longitud" DOUBLE PRECISION,
ADD COLUMN     "estado_actual" "EstadoViaje" NOT NULL DEFAULT 'ACEPTADO',
ADD COLUMN     "id_pasajero" TEXT,
ADD COLUMN     "id_solicitud" TEXT,
ADD COLUMN     "metodo_pago" "MetodoPago" NOT NULL DEFAULT 'EFECTIVO',
ADD COLUMN     "origen_direccion" TEXT,
ADD COLUMN     "origen_latitud" DOUBLE PRECISION,
ADD COLUMN     "origen_longitud" DOUBLE PRECISION,
ADD COLUMN     "pasajero_nombre" TEXT,
ADD COLUMN     "precio_final" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "tiempo_aceptado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "tiempo_comienzo" TIMESTAMP(3),
ADD COLUMN     "tiempo_completado" TIMESTAMP(3),
ALTER COLUMN "estado" SET DEFAULT 'ACEPTADO';

-- CreateTable
CREATE TABLE "HistorialConexion" (
    "id_conexion" TEXT NOT NULL,
    "id_conductor" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistorialConexion_pkey" PRIMARY KEY ("id_conexion")
);

-- CreateIndex
CREATE UNIQUE INDEX "Viaje_id_solicitud_key" ON "Viaje"("id_solicitud");

-- AddForeignKey
ALTER TABLE "HistorialConexion" ADD CONSTRAINT "HistorialConexion_id_conductor_fkey" FOREIGN KEY ("id_conductor") REFERENCES "Conductor"("id_conductor") ON DELETE RESTRICT ON UPDATE CASCADE;
