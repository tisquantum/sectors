-- AlterTable
ALTER TABLE "Share" ADD COLUMN     "isCommitted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ForecastQuarter" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "quarterNumber" INTEGER NOT NULL,
    "shareCost" INTEGER NOT NULL,
    "totalSharesCommitted" INTEGER NOT NULL DEFAULT 0,
    "demandCounters" INTEGER NOT NULL DEFAULT 0,
    "sectorId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForecastQuarter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForecastCommitment" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "gameTurnId" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "quarterId" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "shareCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForecastCommitment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ForecastCommitmentToShare" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ForecastCommitmentToShare_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "ForecastQuarter_gameId_idx" ON "ForecastQuarter"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "ForecastQuarter_gameId_quarterNumber_key" ON "ForecastQuarter"("gameId", "quarterNumber");

-- CreateIndex
CREATE INDEX "ForecastCommitment_gameId_idx" ON "ForecastCommitment"("gameId");

-- CreateIndex
CREATE INDEX "ForecastCommitment_gameTurnId_idx" ON "ForecastCommitment"("gameTurnId");

-- CreateIndex
CREATE INDEX "ForecastCommitment_playerId_idx" ON "ForecastCommitment"("playerId");

-- CreateIndex
CREATE INDEX "ForecastCommitment_quarterId_idx" ON "ForecastCommitment"("quarterId");

-- CreateIndex
CREATE UNIQUE INDEX "ForecastCommitment_playerId_quarterId_gameTurnId_key" ON "ForecastCommitment"("playerId", "quarterId", "gameTurnId");

-- CreateIndex
CREATE INDEX "_ForecastCommitmentToShare_B_index" ON "_ForecastCommitmentToShare"("B");

-- AddForeignKey
ALTER TABLE "ForecastQuarter" ADD CONSTRAINT "ForecastQuarter_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastCommitment" ADD CONSTRAINT "ForecastCommitment_quarterId_fkey" FOREIGN KEY ("quarterId") REFERENCES "ForecastQuarter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastCommitment" ADD CONSTRAINT "ForecastCommitment_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastCommitment" ADD CONSTRAINT "ForecastCommitment_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastCommitment" ADD CONSTRAINT "ForecastCommitment_gameTurnId_fkey" FOREIGN KEY ("gameTurnId") REFERENCES "GameTurn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastCommitment" ADD CONSTRAINT "ForecastCommitment_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastCommitment" ADD CONSTRAINT "ForecastCommitment_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ForecastCommitmentToShare" ADD CONSTRAINT "_ForecastCommitmentToShare_A_fkey" FOREIGN KEY ("A") REFERENCES "ForecastCommitment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ForecastCommitmentToShare" ADD CONSTRAINT "_ForecastCommitmentToShare_B_fkey" FOREIGN KEY ("B") REFERENCES "Share"("id") ON DELETE CASCADE ON UPDATE CASCADE;
