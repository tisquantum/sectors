-- DropForeignKey
ALTER TABLE "RevenueDistributionVote" DROP CONSTRAINT "RevenueDistributionVote_productionResultId_fkey";

-- AlterTable
ALTER TABLE "RevenueDistributionVote" ALTER COLUMN "productionResultId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "RevenueDistributionVote" ADD CONSTRAINT "RevenueDistributionVote_productionResultId_fkey" FOREIGN KEY ("productionResultId") REFERENCES "ProductionResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;
