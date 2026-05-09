-- CreateTable
CREATE TABLE "Conductor" (
    "id_conductor" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "licencia" TEXT NOT NULL,
    "fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_baja" TIMESTAMP(3),

    CONSTRAINT "Conductor_pkey" PRIMARY KEY ("id_conductor")
);

-- CreateTable
CREATE TABLE "Vehiculo" (
    "id_vehiculo" TEXT NOT NULL,
    "patente" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "id_conductor" TEXT NOT NULL,
    "fecha_baja" TIMESTAMP(3),

    CONSTRAINT "Vehiculo_pkey" PRIMARY KEY ("id_vehiculo")
);

-- CreateTable
CREATE TABLE "Viaje" (
    "id_viaje" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "id_conductor" TEXT NOT NULL,
    "id_vehiculo" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Viaje_pkey" PRIMARY KEY ("id_viaje")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conductor_licencia_key" ON "Conductor"("licencia");

-- CreateIndex
CREATE UNIQUE INDEX "Vehiculo_patente_key" ON "Vehiculo"("patente");

-- AddForeignKey
ALTER TABLE "Vehiculo" ADD CONSTRAINT "Vehiculo_id_conductor_fkey" FOREIGN KEY ("id_conductor") REFERENCES "Conductor"("id_conductor") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Viaje" ADD CONSTRAINT "Viaje_id_conductor_fkey" FOREIGN KEY ("id_conductor") REFERENCES "Conductor"("id_conductor") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Viaje" ADD CONSTRAINT "Viaje_id_vehiculo_fkey" FOREIGN KEY ("id_vehiculo") REFERENCES "Vehiculo"("id_vehiculo") ON DELETE RESTRICT ON UPDATE CASCADE;
