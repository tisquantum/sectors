-- CreateTable
CREATE TABLE "MarketingCampaignOrder" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "gameTurnId" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "tier" "MarketingCampaignTier" NOT NULL,
    "slot" INTEGER NOT NULL,
    "cost" INTEGER NOT NULL,
    "resourceTypes" "ResourceType"[],
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingCampaignOrder_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MarketingCampaignOrder" ADD CONSTRAINT "MarketingCampaignOrder_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingCampaignOrder" ADD CONSTRAINT "MarketingCampaignOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingCampaignOrder" ADD CONSTRAINT "MarketingCampaignOrder_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingCampaignOrder" ADD CONSTRAINT "MarketingCampaignOrder_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingCampaignOrder" ADD CONSTRAINT "MarketingCampaignOrder_gameTurnId_fkey" FOREIGN KEY ("gameTurnId") REFERENCES "GameTurn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
