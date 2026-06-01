-- AlterTable
ALTER TABLE "Vehiculo" ADD COLUMN     "numero_poliza" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Vehiculo_numero_poliza_key" ON "Vehiculo"("numero_poliza");
