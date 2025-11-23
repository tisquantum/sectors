-- CreateTable
CREATE TABLE "ResearchOrder" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "gameTurnId" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "researchProgressGain" INTEGER,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchOrder_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ResearchOrder" ADD CONSTRAINT "ResearchOrder_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchOrder" ADD CONSTRAINT "ResearchOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchOrder" ADD CONSTRAINT "ResearchOrder_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchOrder" ADD CONSTRAINT "ResearchOrder_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchOrder" ADD CONSTRAINT "ResearchOrder_gameTurnId_fkey" FOREIGN KEY ("gameTurnId") REFERENCES "GameTurn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
