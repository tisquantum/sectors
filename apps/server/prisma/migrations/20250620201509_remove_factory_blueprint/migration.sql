/*
  Warnings:

  - You are about to drop the column `blueprintId` on the `Factory` table. All the data in the column will be lost.
  - You are about to drop the column `factoryId` on the `MarketingCampaign` table. All the data in the column will be lost.
  - You are about to drop the column `factoryBlueprintId` on the `PlayerOrder` table. All the data in the column will be lost.
  - You are about to drop the `FactoryBlueprint` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_FactoryBlueprintResources` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `sectorId` to the `Factory` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FactoryType" AS ENUM ('CIRCLE', 'SQUARE', 'TRIANGLE', 'SECTOR');

-- DropForeignKey
ALTER TABLE "Factory" DROP CONSTRAINT "Factory_blueprintId_fkey";

-- DropForeignKey
ALTER TABLE "FactoryBlueprint" DROP CONSTRAINT "FactoryBlueprint_companyId_fkey";

-- DropForeignKey
ALTER TABLE "FactoryBlueprint" DROP CONSTRAINT "FactoryBlueprint_gameId_fkey";

-- DropForeignKey
ALTER TABLE "MarketingCampaign" DROP CONSTRAINT "MarketingCampaign_factoryId_fkey";

-- DropForeignKey
ALTER TABLE "_FactoryBlueprintResources" DROP CONSTRAINT "_FactoryBlueprintResources_A_fkey";

-- DropForeignKey
ALTER TABLE "_FactoryBlueprintResources" DROP CONSTRAINT "_FactoryBlueprintResources_B_fkey";

-- AlterTable
ALTER TABLE "Factory" DROP COLUMN "blueprintId",
ADD COLUMN     "resourceTypes" "ResourceType"[],
ADD COLUMN     "sectorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MarketingCampaign" DROP COLUMN "factoryId",
ADD COLUMN     "slot" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PlayerOrder" DROP COLUMN "factoryBlueprintId";

-- DropTable
DROP TABLE "FactoryBlueprint";

-- DropTable
DROP TABLE "_FactoryBlueprintResources";

-- DropEnum
DROP TYPE "FactoryBlueprintType";

-- AddForeignKey
ALTER TABLE "Factory" ADD CONSTRAINT "Factory_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
