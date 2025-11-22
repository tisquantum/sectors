/*
  Warnings:

  - Added the required column `gameTurnId` to the `MarketingCampaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `MarketingCampaign` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MarketingCampaign" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "gameTurnId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "MarketingCampaign" ADD CONSTRAINT "MarketingCampaign_gameTurnId_fkey" FOREIGN KEY ("gameTurnId") REFERENCES "GameTurn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
