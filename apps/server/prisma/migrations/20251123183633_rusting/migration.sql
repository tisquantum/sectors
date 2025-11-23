-- AlterEnum
ALTER TYPE "PhaseName" ADD VALUE 'RUSTED_FACTORY_UPGRADE';

-- AlterTable
ALTER TABLE "Factory" ADD COLUMN     "isRusted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalConstructionCost" INTEGER;
