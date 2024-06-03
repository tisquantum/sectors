-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "cashOnHand" DOUBLE PRECISION NOT NULL,
    "gameId" TEXT NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerStock" (
    "playerId" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "ownershipPercentage" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PlayerStock_pkey" PRIMARY KEY ("playerId","stockId")
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" TEXT NOT NULL,
    "currentPrice" DOUBLE PRECISION NOT NULL,
    "companyId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currentStockPrice" DOUBLE PRECISION NOT NULL,
    "cashOnHand" DOUBLE PRECISION NOT NULL,
    "throughput" INTEGER NOT NULL,
    "sector" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "insolvent" INTEGER NOT NULL,
    "mergedWithParent" TEXT,
    "mergedWithChildren" JSONB NOT NULL,
    "lastRevenueValue" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyStock" (
    "companyId" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,

    CONSTRAINT "CompanyStock_pkey" PRIMARY KEY ("companyId","stockId")
);

-- CreateTable
CREATE TABLE "StockHistory" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "productionRevenue" DOUBLE PRECISION NOT NULL,
    "gameId" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL,

    CONSTRAINT "StockHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockRound" (
    "id" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,

    CONSTRAINT "StockRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatingRound" (
    "id" TEXT NOT NULL,
    "actions" JSONB NOT NULL,
    "gameId" TEXT NOT NULL,

    CONSTRAINT "OperatingRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchDeck" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "cards" JSONB NOT NULL,

    CONSTRAINT "ResearchDeck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sector" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "supply" INTEGER NOT NULL,
    "demand" INTEGER NOT NULL,
    "marketingPrice" DOUBLE PRECISION NOT NULL,
    "floatNumber" INTEGER NOT NULL,

    CONSTRAINT "Sector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currentTurn" INTEGER NOT NULL,
    "currentOrSubRound" INTEGER NOT NULL,
    "currentRound" TEXT NOT NULL,
    "currentActivePlayer" TEXT,
    "bankPoolNumber" INTEGER NOT NULL,
    "consumerPoolNumber" INTEGER NOT NULL,
    "gameStatus" TEXT NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GamePlayer" (
    "gameId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,

    CONSTRAINT "GamePlayer_pkey" PRIMARY KEY ("gameId","playerId")
);

-- CreateTable
CREATE TABLE "GameCompany" (
    "gameId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "GameCompany_pkey" PRIMARY KEY ("gameId","companyId")
);

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerStock" ADD CONSTRAINT "PlayerStock_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerStock" ADD CONSTRAINT "PlayerStock_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyStock" ADD CONSTRAINT "CompanyStock_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyStock" ADD CONSTRAINT "CompanyStock_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockHistory" ADD CONSTRAINT "StockHistory_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockRound" ADD CONSTRAINT "StockRound_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatingRound" ADD CONSTRAINT "OperatingRound_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchDeck" ADD CONSTRAINT "ResearchDeck_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamePlayer" ADD CONSTRAINT "GamePlayer_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamePlayer" ADD CONSTRAINT "GamePlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameCompany" ADD CONSTRAINT "GameCompany_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameCompany" ADD CONSTRAINT "GameCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
