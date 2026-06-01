-- AlterTable
ALTER TABLE "Conductor" ADD COLUMN     "comentario_promedio" TEXT,
ADD COLUMN     "fecha_ultima_liquidacion" TIMESTAMP(3),
ADD COLUMN     "motivoBaja" TEXT,
ADD COLUMN     "vehiculo_activo_id" TEXT;
