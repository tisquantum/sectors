/*
  Warnings:

  - Added the required column `gameTurnId` to the `FactoryConstructionOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sectorId` to the `FactoryConstructionOrder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FactoryConstructionOrder" ADD COLUMN     "gameTurnId" TEXT NOT NULL,
ADD COLUMN     "sectorId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "FactoryProduction" (
    "id" TEXT NOT NULL,
    "factoryId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "gameTurnId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customersServed" INTEGER NOT NULL DEFAULT 0,
    "revenue" INTEGER NOT NULL DEFAULT 0,
    "costs" INTEGER NOT NULL DEFAULT 0,
    "profit" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FactoryProduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsumptionMarker" (
    "id" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "resourceType" "ResourceType" NOT NULL,
    "isPermanent" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsumptionMarker_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FactoryProduction" ADD CONSTRAINT "FactoryProduction_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactoryProduction" ADD CONSTRAINT "FactoryProduction_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactoryProduction" ADD CONSTRAINT "FactoryProduction_gameTurnId_fkey" FOREIGN KEY ("gameTurnId") REFERENCES "GameTurn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactoryProduction" ADD CONSTRAINT "FactoryProduction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumptionMarker" ADD CONSTRAINT "ConsumptionMarker_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumptionMarker" ADD CONSTRAINT "ConsumptionMarker_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumptionMarker" ADD CONSTRAINT "ConsumptionMarker_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactoryConstructionOrder" ADD CONSTRAINT "FactoryConstructionOrder_gameTurnId_fkey" FOREIGN KEY ("gameTurnId") REFERENCES "GameTurn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
