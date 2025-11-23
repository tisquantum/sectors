/*
  Warnings:

  - You are about to drop the column `insolvent` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `lastRevenueValue` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `sector` on the `Company` table. All the data in the column will be lost.
  - You are about to alter the column `currentStockPrice` on the `Company` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `cashOnHand` on the `Company` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - The `gameStatus` column on the `Game` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `OperatingRound` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `actions` on the `OperatingRound` table. All the data in the column will be lost.
  - You are about to alter the column `cashOnHand` on the `Player` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to drop the column `cards` on the `ResearchDeck` table. All the data in the column will be lost.
  - You are about to drop the column `gameId` on the `Room` table. All the data in the column will be lost.
  - The primary key for the `RoomUser` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `floatNumber` on the `Sector` table. All the data in the column will be lost.
  - You are about to drop the column `stockId` on the `StockHistory` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `StockHistory` table. All the data in the column will be lost.
  - You are about to alter the column `price` on the `StockHistory` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `productionRevenue` on the `StockHistory` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - The primary key for the `StockRound` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `phase` on the `StockRound` table. All the data in the column will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `CompanyStock` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GameCompany` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GamePlayer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PlayerStock` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Stock` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[entityId]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[entityId]` on the table `Player` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[playerId]` on the table `RoomUser` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sectorId` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stockSymbol` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gameStep` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roomId` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `currentRound` on the `Game` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `gameTurnId` to the `OperatingRound` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `OperatingRound` table without a default value. This is not possible if the table is not empty.
  - Added the required column `limitOrderActions` to the `Player` table without a default value. This is not possible if the table is not empty.
  - Added the required column `marketOrderActions` to the `Player` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shortOrderActions` to the `Player` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Player` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ResearchDeck` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `RoomMessage` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `userId` on the `RoomMessage` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `RoomUser` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `basePrice` to the `Sector` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Sector` table without a default value. This is not possible if the table is not empty.
  - Added the required column `action` to the `StockHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `StockHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phaseId` to the `StockHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stepsMoved` to the `StockHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `StockHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gameTurnId` to the `StockRound` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `StockRound` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `authUserId` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'FROZEN', 'BANKRUPT');

-- CreateEnum
CREATE TYPE "OverdraftTier" AS ENUM ('TIER_1', 'TIER_2', 'TIER_3', 'TIER_4', 'TIER_5');

-- CreateEnum
CREATE TYPE "ShareLocation" AS ENUM ('OPEN_MARKET', 'IPO', 'PLAYER', 'DERIVATIVE_MARKET');

-- CreateEnum
CREATE TYPE "StockTier" AS ENUM ('TIER_1', 'TIER_2', 'TIER_3', 'TIER_4', 'TIER_5');

-- CreateEnum
CREATE TYPE "FactorySize" AS ENUM ('FACTORY_I', 'FACTORY_II', 'FACTORY_III', 'FACTORY_IV');

-- CreateEnum
CREATE TYPE "CompanyTier" AS ENUM ('INCUBATOR', 'STARTUP', 'GROWTH', 'ESTABLISHED', 'ENTERPRISE', 'CONGLOMERATE', 'TITAN');

-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'INSOLVENT', 'BANKRUPT');

-- CreateEnum
CREATE TYPE "StockAction" AS ENUM ('INITIAL', 'MARKET_BUY', 'MARKET_SELL', 'SHORT', 'LIMIT_BUY', 'LIMIT_SELL', 'CALL_OPTION', 'PRODUCTION', 'RESEARCH_EFFECT', 'PRESTIGE_REWARD', 'MAGNET_EFFECT');

-- CreateEnum
CREATE TYPE "DistributionStrategy" AS ENUM ('FAIR_SPLIT', 'PRIORITY', 'BID_PRIORITY');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'OPEN', 'FILLED', 'FILLED_PENDING_SETTLEMENT', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ContractState" AS ENUM ('PURCHASED', 'FOR_SALE', 'DISCARDED', 'QUEUED', 'EXPIRED', 'EXERCISED');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('MARKET', 'SHORT', 'LIMIT', 'OPTION');

-- CreateEnum
CREATE TYPE "PrestigeReward" AS ENUM ('ELASTICITY', 'CAPITAL_INJECTION', 'MAGNET_EFFECT', 'INVESTOR_CONFIDENCE', 'BULL_SIGNAL', 'INFLUENCER');

-- CreateEnum
CREATE TYPE "RevenueDistribution" AS ENUM ('DIVIDEND_FULL', 'DIVIDEND_FIFTY_FIFTY', 'RETAINED');

-- CreateEnum
CREATE TYPE "OperatingRoundAction" AS ENUM ('MARKETING', 'MARKETING_SMALL_CAMPAIGN', 'RESEARCH', 'MERGE', 'DOWNSIZE', 'PRODUCTION', 'EXPANSION', 'SHARE_BUYBACK', 'SHARE_ISSUE', 'SPEND_PRESTIGE', 'VETO', 'INCREASE_PRICE', 'DECREASE_PRICE', 'LOBBY', 'LOAN', 'OUTSOURCE', 'LICENSING_AGREEMENT', 'VISIONARY', 'STRATEGIC_RESERVE', 'RAPID_EXPANSION', 'FASTTRACK_APPROVAL', 'PRICE_FREEZE', 'REBRAND', 'SURGE_PRICING', 'INNOVATION_SURGE', 'REGULATORY_SHIELD', 'EXTRACT', 'MANUFACTURE', 'STEADY_DEMAND', 'BOOM_CYCLE', 'CARBON_CREDIT');

-- CreateEnum
CREATE TYPE "ResearchCardEffectType" AS ENUM ('PERMANENT', 'ONE_TIME_USE', 'DECAY');

-- CreateEnum
CREATE TYPE "ResearchCardEffect" AS ENUM ('PRODUCT_DEVELOPMENT', 'QUALITY_CONTROL', 'GOVERNMENT_GRANT', 'CLINICAL_TRIAL', 'RENEWABLE_ENERGY', 'ARTIFICIAL_INTELLIGENCE', 'ECOMMERCE', 'ROBOTICS', 'NEW_ALLOY', 'ENERGY_SAVING', 'CORPORATE_ESPIONAGE', 'GLOBALIZATION', 'ECONOMIES_OF_SCALE', 'MARKET_EXPANSION', 'AUTOMATION', 'SPECIALIZATION', 'DIVERSIFICATION', 'INNOVATION', 'NO_DISCERNIBLE_FINDINGS');

-- CreateEnum
CREATE TYPE "MarketingCampaignTier" AS ENUM ('TIER_1', 'TIER_2', 'TIER_3');

-- CreateEnum
CREATE TYPE "SectorName" AS ENUM ('MATERIALS', 'INDUSTRIALS', 'CONSUMER_DISCRETIONARY', 'CONSUMER_STAPLES', 'CONSUMER_CYCLICAL', 'CONSUMER_DEFENSIVE', 'ENERGY', 'HEALTHCARE', 'TECHNOLOGY', 'GENERAL');

-- CreateEnum
CREATE TYPE "HeadlineLocation" AS ENUM ('DECK', 'FOR_SALE', 'SOLD', 'DISCARDED');

-- CreateEnum
CREATE TYPE "HeadlineType" AS ENUM ('COMPANY_NEGATIVE_1', 'COMPANY_NEGATIVE_2', 'COMPANY_NEGATIVE_3', 'COMPANY_POSITIVE_1', 'COMPANY_POSITIVE_2', 'COMPANY_POSITIVE_3', 'SECTOR_NEGATIVE_1', 'SECTOR_NEGATIVE_2', 'SECTOR_NEGATIVE_3', 'SECTOR_POSITIVE_1', 'SECTOR_POSITIVE_2', 'SECTOR_POSITIVE_3');

-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAUSED', 'FINISHED');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('TRIANGLE', 'SQUARE', 'CIRCLE', 'MATERIALS', 'INDUSTRIALS', 'CONSUMER_DISCRETIONARY', 'CONSUMER_STAPLES', 'CONSUMER_CYCLICAL', 'CONSUMER_DEFENSIVE', 'ENERGY', 'HEALTHCARE', 'TECHNOLOGY', 'GENERAL');

-- CreateEnum
CREATE TYPE "RoundType" AS ENUM ('INFLUENCE', 'PRIZE', 'GAME_UPKEEP', 'STOCK', 'OPERATING');

-- CreateEnum
CREATE TYPE "PhaseName" AS ENUM ('INFLUENCE_BID_ACTION', 'INFLUENCE_BID_REVEAL', 'INFLUENCE_BID_RESOLVE', 'START_TURN', 'END_TURN', 'SET_COMPANY_IPO_PRICES', 'RESOLVE_SET_COMPANY_IPO_PRICES', 'STOCK_RESOLVE_LIMIT_ORDER', 'STOCK_MEET', 'STOCK_ACTION_ORDER', 'STOCK_ACTION_RESULT', 'STOCK_ACTION_REVEAL', 'STOCK_RESOLVE_MARKET_ORDER', 'STOCK_SHORT_ORDER_INTEREST', 'STOCK_ACTION_SHORT_ORDER', 'STOCK_RESOLVE_PENDING_SHORT_ORDER', 'STOCK_RESOLVE_PENDING_OPTION_ORDER', 'STOCK_ACTION_OPTION_ORDER', 'STOCK_RESOLVE_OPTION_ORDER', 'STOCK_OPEN_LIMIT_ORDERS', 'STOCK_RESULTS_OVERVIEW', 'OPERATING_PRODUCTION', 'OPERATING_PRODUCTION_VOTE', 'OPERATING_PRODUCTION_VOTE_RESOLVE', 'OPERATING_STOCK_PRICE_ADJUSTMENT', 'OPERATING_MEET', 'OPERATING_ACTION_COMPANY_VOTE', 'OPERATING_ACTION_COMPANY_VOTE_RESULT', 'OPERATING_COMPANY_VOTE_RESOLVE', 'CAPITAL_GAINS', 'DIVESTMENT', 'SECTOR_NEW_COMPANY', 'PRIZE_VOTE_ACTION', 'PRIZE_VOTE_RESOLVE', 'PRIZE_DISTRIBUTE_ACTION', 'PRIZE_DISTRIBUTE_RESOLVE', 'HEADLINE_RESOLVE', 'SHAREHOLDER_MEETING', 'FACTORY_CONSTRUCTION', 'FACTORY_CONSTRUCTION_RESOLVE', 'MARKETING_CAMPAIGN', 'MARKETING_CAMPAIGN_RESOLVE', 'RESEARCH_ACTION', 'RESEARCH_ACTION_RESOLVE', 'CONSUMPTION_PHASE');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('PLAYER', 'PLAYER_MARGIN_ACCOUNT', 'COMPANY', 'BANK', 'OPEN_MARKET', 'DERIVATIVE_MARKET', 'IPO', 'FACTORY', 'MARKETING_CAMPAIGN', 'RESEARCH');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('SHARE', 'CASH', 'FACTORY_CONSTRUCTION', 'MARKETING_CAMPAIGN', 'RESEARCH', 'RESOURCE', 'WORKER');

-- CreateEnum
CREATE TYPE "TransactionSubType" AS ENUM ('DEFAULT', 'SHORT', 'OPTION_CALL', 'OPTION_CALL_EXERCISE', 'LIMIT_BUY', 'LIMIT_SELL', 'MARKET_BUY', 'MARKET_SELL', 'DIVESTMENT', 'OPERATING_COST', 'DIVIDEND', 'TRANCHE', 'INFLUENCE', 'SHARE_LIQUIDATION', 'HEADLINE_PURCHASE');

-- CreateEnum
CREATE TYPE "PrizeDistributionType" AS ENUM ('CASH', 'PRESTIGE', 'PASSIVE_EFFECT');

-- CreateEnum
CREATE TYPE "AwardTrackType" AS ENUM ('RESEARCH', 'MARKETING', 'CATALYST');

-- CreateEnum
CREATE TYPE "ExecutiveGameStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAUSED', 'FINISHED');

-- CreateEnum
CREATE TYPE "ExecutivePhaseName" AS ENUM ('START_GAME', 'START_TURN', 'END_TURN', 'MOVE_COO_AND_GENERAL_COUNSEL', 'DEAL_CARDS', 'INFLUENCE_BID', 'INFLUENCE_BID_SELECTION', 'REVEAL_TRUMP', 'START_TRICK', 'SELECT_TRICK', 'REVEAL_TRICK', 'RESOLVE_TRICK', 'START_VOTE', 'VOTE', 'RESOLVE_VOTE', 'RESOLVE_AGENDA', 'RESOLVE_LEADERSHIP', 'GAME_END');

-- CreateEnum
CREATE TYPE "TurnType" AS ENUM ('INFLUENCE', 'TRICK');

-- CreateEnum
CREATE TYPE "CardLocation" AS ENUM ('DECK', 'TRUMP', 'DISCARD', 'TRICK', 'HAND', 'GIFT', 'BRIBE');

-- CreateEnum
CREATE TYPE "Agenda" AS ENUM ('CEO_THREE_PLAYERS', 'FIRST_LEFT_CEO', 'SECOND_LEFT_CEO', 'THIRD_LEFT_CEO', 'BECOME_CEO_NO_SHARE', 'FOREIGN_INVESTOR_CEO', 'BECOME_CEO_WITH_FOREIGN_INVESTOR');

-- CreateEnum
CREATE TYPE "VictoryPointType" AS ENUM ('GIFT', 'VOTE', 'RELATIONSHIP', 'AGENDA');

-- CreateEnum
CREATE TYPE "InfluenceType" AS ENUM ('CEO', 'PLAYER');

-- CreateEnum
CREATE TYPE "InfluenceLocation" AS ENUM ('CEO', 'OF_PLAYER', 'BRIBE', 'RELATIONSHIP', 'OWNED_BY_PLAYER', 'VOTE');

-- CreateEnum
CREATE TYPE "CardSuit" AS ENUM ('DIAMOND', 'HEART', 'CLUB', 'SPADE');

-- CreateEnum
CREATE TYPE "OperationMechanicsVersion" AS ENUM ('LEGACY', 'MODERN');

-- CreateEnum
CREATE TYPE "ResourceTrackType" AS ENUM ('GLOBAL', 'SECTOR');

-- CreateEnum
CREATE TYPE "FactoryBlueprintType" AS ENUM ('CIRCLE', 'SQUARE', 'TRIANGLE', 'SECTOR');

-- CreateEnum
CREATE TYPE "MarketingCampaignStatus" AS ENUM ('ACTIVE', 'DECAYING', 'EXPIRED');

-- DropForeignKey
ALTER TABLE "CompanyStock" DROP CONSTRAINT "CompanyStock_companyId_fkey";

-- DropForeignKey
ALTER TABLE "CompanyStock" DROP CONSTRAINT "CompanyStock_stockId_fkey";

-- DropForeignKey
ALTER TABLE "GameCompany" DROP CONSTRAINT "GameCompany_companyId_fkey";

-- DropForeignKey
ALTER TABLE "GameCompany" DROP CONSTRAINT "GameCompany_gameId_fkey";

-- DropForeignKey
ALTER TABLE "GamePlayer" DROP CONSTRAINT "GamePlayer_gameId_fkey";

-- DropForeignKey
ALTER TABLE "GamePlayer" DROP CONSTRAINT "GamePlayer_playerId_fkey";

-- DropForeignKey
ALTER TABLE "PlayerStock" DROP CONSTRAINT "PlayerStock_playerId_fkey";

-- DropForeignKey
ALTER TABLE "PlayerStock" DROP CONSTRAINT "PlayerStock_stockId_fkey";

-- DropForeignKey
ALTER TABLE "Room" DROP CONSTRAINT "Room_gameId_fkey";

-- DropForeignKey
ALTER TABLE "RoomMessage" DROP CONSTRAINT "RoomMessage_userId_fkey";

-- DropForeignKey
ALTER TABLE "RoomUser" DROP CONSTRAINT "RoomUser_userId_fkey";

-- DropForeignKey
ALTER TABLE "Stock" DROP CONSTRAINT "Stock_companyId_fkey";

-- DropForeignKey
ALTER TABLE "StockHistory" DROP CONSTRAINT "StockHistory_stockId_fkey";

-- AlterTable
ALTER TABLE "Company" DROP COLUMN "insolvent",
DROP COLUMN "lastRevenueValue",
DROP COLUMN "sector",
ADD COLUMN     "baseDemand" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "brandScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ceoId" TEXT,
ADD COLUMN     "companyTier" "CompanyTier" NOT NULL DEFAULT 'INCUBATOR',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "demandScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "hasEconomiesOfScale" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasLoan" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ipoAndFloatPrice" INTEGER,
ADD COLUMN     "isFloated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "marketFavors" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "operationMechanicsVersion" "OperationMechanicsVersion" NOT NULL DEFAULT 'LEGACY',
ADD COLUMN     "prestigeTokens" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "researchGrants" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "researchProgress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sectorId" TEXT NOT NULL,
ADD COLUMN     "status" "CompanyStatus" NOT NULL DEFAULT 'INACTIVE',
ADD COLUMN     "stockSymbol" TEXT NOT NULL,
ADD COLUMN     "stockTier" "StockTier" NOT NULL DEFAULT 'TIER_1',
ADD COLUMN     "supplyBase" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "supplyCurrent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "supplyMax" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tierSharesFulfilled" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unitPrice" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "currentStockPrice" DROP NOT NULL,
ALTER COLUMN "currentStockPrice" SET DEFAULT 0,
ALTER COLUMN "currentStockPrice" SET DATA TYPE INTEGER,
ALTER COLUMN "cashOnHand" SET DEFAULT 0,
ALTER COLUMN "cashOnHand" SET DATA TYPE INTEGER,
ALTER COLUMN "mergedWithChildren" DROP NOT NULL,
ALTER COLUMN "mergedWithChildren" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "capitalInjectionRewards" INTEGER[],
ADD COLUMN     "certificateLimit" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currentOperatingRoundId" TEXT,
ADD COLUMN     "currentPhaseId" TEXT,
ADD COLUMN     "currentStockRoundId" TEXT,
ADD COLUMN     "distributionStrategy" "DistributionStrategy" NOT NULL DEFAULT 'FAIR_SPLIT',
ADD COLUMN     "economyScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "gameMaxTurns" INTEGER,
ADD COLUMN     "gameStep" INTEGER NOT NULL,
ADD COLUMN     "isPaused" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isTimerless" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "laborWorkers" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "nextPrestigeReward" INTEGER,
ADD COLUMN     "operationMechanicsVersion" "OperationMechanicsVersion" NOT NULL DEFAULT 'LEGACY',
ADD COLUMN     "overdraft" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "playerOrdersConcealed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "roomId" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "useLimitOrders" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "useOptionOrders" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "useShortOrders" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "workers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "workforcePool" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "currentTurn" SET DATA TYPE TEXT,
DROP COLUMN "currentRound",
ADD COLUMN     "currentRound" "RoundType" NOT NULL,
DROP COLUMN "gameStatus",
ADD COLUMN     "gameStatus" "GameStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "OperatingRound" DROP CONSTRAINT "OperatingRound_pkey",
DROP COLUMN "actions",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "gameTurnId" TEXT NOT NULL,
ADD COLUMN     "marketingAllocation" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "operationMechanicsVersion" "OperationMechanicsVersion" NOT NULL DEFAULT 'LEGACY',
ADD COLUMN     "researchAllocation" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "workforceAllocation" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "OperatingRound_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "OperatingRound_id_seq";

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "isBot" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "limitOrderActions" INTEGER NOT NULL,
ADD COLUMN     "marginAccount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "marketOrderActions" INTEGER NOT NULL,
ADD COLUMN     "overdraftTier" "OverdraftTier",
ADD COLUMN     "shortOrderActions" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" UUID,
ALTER COLUMN "cashOnHand" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "ResearchDeck" DROP COLUMN "cards",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "gameId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "RoomMessage" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL,
ALTER COLUMN "timestamp" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "RoomUser" DROP CONSTRAINT "RoomUser_pkey",
ADD COLUMN     "playerId" TEXT,
ADD COLUMN     "roomHost" BOOLEAN,
DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL,
ADD CONSTRAINT "RoomUser_pkey" PRIMARY KEY ("userId", "roomId");

-- AlterTable
ALTER TABLE "Sector" DROP COLUMN "floatNumber",
ADD COLUMN     "basePrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "consumers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "demandBonus" INTEGER DEFAULT 0,
ADD COLUMN     "demandMax" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "demandMin" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "gameId" TEXT,
ADD COLUMN     "ipoMax" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "ipoMin" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "researchMarker" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sectorName" "SectorName" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "sharePercentageToFloat" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "supplyDefault" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "supplyMax" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "supplyMin" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "technologyLevel" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unitPriceMax" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unitPriceMin" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "StockHistory" DROP COLUMN "stockId",
DROP COLUMN "timestamp",
ADD COLUMN     "action" "StockAction" NOT NULL,
ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "phaseId" TEXT NOT NULL,
ADD COLUMN     "stepsMoved" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "price" SET DATA TYPE INTEGER,
ALTER COLUMN "productionRevenue" DROP NOT NULL,
ALTER COLUMN "productionRevenue" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "StockRound" DROP CONSTRAINT "StockRound_pkey",
DROP COLUMN "phase",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "gameTurnId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "StockRound_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "StockRound_id_seq";

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'anon',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "authUserId",
ADD COLUMN     "authUserId" UUID NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "CompanyStock";

-- DropTable
DROP TABLE "GameCompany";

-- DropTable
DROP TABLE "GamePlayer";

-- DropTable
DROP TABLE "PlayerStock";

-- DropTable
DROP TABLE "Stock";

-- CreateTable
CREATE TABLE "Share" (
    "id" TEXT NOT NULL,
    "price" INTEGER,
    "companyId" TEXT NOT NULL,
    "location" "ShareLocation" NOT NULL,
    "gameId" TEXT NOT NULL,
    "playerId" TEXT,
    "shortOrderId" INTEGER,
    "optionContractId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Share_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Factory" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "size" "FactorySize" NOT NULL,
    "workers" INTEGER NOT NULL,
    "isOperational" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "blueprintId" TEXT,

    CONSTRAINT "Factory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyIpoPriceVote" (
    "id" SERIAL NOT NULL,
    "companyId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "ipoPrice" INTEGER NOT NULL,
    "gameTurnId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyIpoPriceVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockSubRound" (
    "id" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "stockRoundId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "gameTurnId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockSubRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerOrder" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "orderType" "OrderType" NOT NULL,
    "factoryBlueprintId" TEXT,
    "stockRoundId" TEXT NOT NULL,
    "stockSubRoundId" TEXT NOT NULL,
    "orderStatus" "OrderStatus" NOT NULL,
    "quantity" INTEGER,
    "realizedQuantity" INTEGER,
    "value" INTEGER,
    "isSell" BOOLEAN,
    "isConcealed" BOOLEAN DEFAULT true,
    "optionContractId" INTEGER,
    "ipoAndFloatPrice" INTEGER,
    "gameTurnCreated" TEXT NOT NULL,
    "location" "ShareLocation" NOT NULL,
    "submissionStamp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShortOrder" (
    "id" SERIAL NOT NULL,
    "shortSalePrice" INTEGER NOT NULL,
    "shortStockPriceAtPurchase" INTEGER NOT NULL,
    "marginAccountMinimum" INTEGER NOT NULL,
    "borrowRate" INTEGER NOT NULL,
    "coverPrice" INTEGER,
    "playerOrderId" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShortOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptionContract" (
    "id" SERIAL NOT NULL,
    "premium" INTEGER NOT NULL,
    "currentPremium" INTEGER,
    "strikePrice" INTEGER NOT NULL,
    "exercisePrice" INTEGER,
    "term" INTEGER NOT NULL,
    "currentTerm" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "stepBonus" INTEGER NOT NULL DEFAULT 0,
    "tableauSlot" INTEGER DEFAULT 0,
    "playerOrderId" INTEGER,
    "companyId" TEXT NOT NULL,
    "contractState" "ContractState" NOT NULL,
    "gameId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OptionContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapitalGains" (
    "id" SERIAL NOT NULL,
    "gameId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "capitalGains" INTEGER NOT NULL,
    "taxPercentage" INTEGER NOT NULL,
    "gameTurnId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapitalGains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrestigeRewards" (
    "id" SERIAL NOT NULL,
    "gameId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "gameTurnId" TEXT NOT NULL,
    "reward" "PrestigeReward" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrestigeRewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionResult" (
    "id" SERIAL NOT NULL,
    "companyId" TEXT NOT NULL,
    "operatingRoundId" TEXT NOT NULL,
    "revenue" INTEGER NOT NULL,
    "consumers" INTEGER NOT NULL DEFAULT 0,
    "steps" INTEGER NOT NULL DEFAULT 0,
    "throughputResult" INTEGER NOT NULL DEFAULT 0,
    "revenueDistribution" "RevenueDistribution",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueDistributionVote" (
    "id" SERIAL NOT NULL,
    "operatingRoundId" TEXT NOT NULL,
    "productionResultId" INTEGER NOT NULL,
    "playerId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "revenueDistribution" "RevenueDistribution" NOT NULL,
    "submissionStamp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueDistributionVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyAction" (
    "id" SERIAL NOT NULL,
    "companyId" TEXT NOT NULL,
    "action" "OperatingRoundAction",
    "operatingRoundId" TEXT,
    "cost" INTEGER NOT NULL DEFAULT 0,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "actedOn" BOOLEAN DEFAULT false,
    "isPassive" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gameTurnId" TEXT,

    CONSTRAINT "CompanyAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsolvencyContribution" (
    "id" SERIAL NOT NULL,
    "gameId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "cashContribution" INTEGER NOT NULL,
    "shareContribution" INTEGER NOT NULL,
    "gameTurnId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsolvencyContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareContribution" (
    "id" SERIAL NOT NULL,
    "insolvencyContributionId" INTEGER NOT NULL,
    "shareId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShareContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatingRoundVote" (
    "id" SERIAL NOT NULL,
    "operatingRoundId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "actionVoted" "OperatingRoundAction" NOT NULL,
    "submissionStamp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatingRoundVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Card" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sector" "SectorName" NOT NULL,
    "effect" "ResearchCardEffect" NOT NULL,
    "effectType" "ResearchCardEffectType" NOT NULL DEFAULT 'PERMANENT',
    "effectUsed" BOOLEAN DEFAULT false,
    "deckId" INTEGER NOT NULL,
    "gameId" TEXT NOT NULL,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectorMarketing" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "campaignTier" "MarketingCampaignTier" NOT NULL,
    "workers" INTEGER NOT NULL,

    CONSTRAINT "SectorMarketing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectorPriority" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SectorPriority_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Headline" (
    "id" TEXT NOT NULL,
    "type" "HeadlineType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "timestamp" TEXT NOT NULL,
    "sectorId" TEXT,
    "companyId" TEXT,
    "saleSlot" INTEGER,
    "location" "HeadlineLocation" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Headline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerHeadline" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "headlineId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "gameTurnId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerHeadline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameTurn" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "turn" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameTurn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "trackType" "ResourceTrackType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyActionOrder" (
    "id" TEXT NOT NULL,
    "gameTurnId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "orderPriority" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyActionOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerPriority" (
    "id" TEXT NOT NULL,
    "gameTurnId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,

    CONSTRAINT "PlayerPriority_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Phase" (
    "id" TEXT NOT NULL,
    "name" "PhaseName" NOT NULL,
    "gameId" TEXT NOT NULL,
    "gameTurnId" TEXT NOT NULL,
    "phaseTime" INTEGER NOT NULL,
    "stockRoundId" TEXT,
    "stockSubRoundId" TEXT,
    "operatingRoundId" TEXT,
    "influenceRoundId" INTEGER,
    "companyId" TEXT,
    "sectorId" TEXT,
    "phaseStartTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Phase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfluenceRound" (
    "id" SERIAL NOT NULL,
    "gameId" TEXT NOT NULL,
    "roundStep" INTEGER NOT NULL,
    "gameTurnId" TEXT NOT NULL,
    "maxInfluence" INTEGER NOT NULL DEFAULT 0,
    "isRevealed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InfluenceRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfluenceVote" (
    "id" SERIAL NOT NULL,
    "influenceRoundId" INTEGER NOT NULL,
    "playerId" TEXT NOT NULL,
    "influence" INTEGER NOT NULL,
    "submissionStamp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InfluenceVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameLog" (
    "id" SERIAL NOT NULL,
    "gameId" TEXT,
    "phaseId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingMessage" (
    "id" SERIAL NOT NULL,
    "gameId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "gameStep" INTEGER NOT NULL,
    "timestamp" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameRecord" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerResult" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "netWorth" INTEGER NOT NULL,
    "placement" INTEGER NOT NULL,
    "rankingPoints" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gameRecordId" TEXT NOT NULL,

    CONSTRAINT "PlayerResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entity" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "marginAccountId" TEXT,

    CONSTRAINT "Entity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "gameTurnId" TEXT NOT NULL,
    "fromEntityId" TEXT NOT NULL,
    "toEntityId" TEXT NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "transactionSubType" "TransactionSubType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT,
    "companyInvolvedId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionsOnShares" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "shareId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionsOnShares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prize" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "gameTurnId" TEXT NOT NULL,
    "playerId" TEXT,
    "sectorPrizeId" TEXT[],
    "prestigeAmount" INTEGER,
    "cashAmount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrizeDistribution" (
    "id" TEXT NOT NULL,
    "prizeId" TEXT NOT NULL,
    "distributionType" "PrizeDistributionType" NOT NULL,
    "playerId" TEXT,
    "prestigeAmount" INTEGER,
    "cashAmount" INTEGER,
    "passiveEffect" "OperatingRoundAction",
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gameTurnId" TEXT,

    CONSTRAINT "PrizeDistribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrizeVote" (
    "id" SERIAL NOT NULL,
    "playerId" TEXT NOT NULL,
    "gameTurnId" TEXT NOT NULL,
    "prizeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrizeVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectorPrize" (
    "id" TEXT NOT NULL,
    "prizeId" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SectorPrize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyAwardTrack" (
    "id" UUID NOT NULL,
    "gameId" TEXT NOT NULL,
    "awardTrackType" "AwardTrackType" NOT NULL,
    "awardTrackName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyAwardTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyAwardTrackSpace" (
    "id" UUID NOT NULL,
    "gameId" TEXT NOT NULL,
    "awardTrackId" UUID NOT NULL,
    "awardTrackSpaceNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyAwardTrackSpace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanySpace" (
    "id" UUID NOT NULL,
    "companyId" TEXT NOT NULL,
    "companyAwardTrackSpaceId" UUID NOT NULL,
    "receivedAward" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySpace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutiveGame" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gameStatus" "ExecutiveGameStatus" NOT NULL DEFAULT 'PENDING',
    "roomId" INTEGER NOT NULL,

    CONSTRAINT "ExecutiveGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutiveGameTurn" (
    "id" UUID NOT NULL,
    "gameId" UUID NOT NULL,
    "turnNumber" INTEGER NOT NULL,
    "turnType" "TurnType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutiveGameTurn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutivePlayerPass" (
    "id" UUID NOT NULL,
    "playerId" UUID NOT NULL,
    "gameTurnId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutivePlayerPass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutivePhase" (
    "id" UUID NOT NULL,
    "gameId" UUID NOT NULL,
    "gameTurnId" UUID NOT NULL,
    "activePlayerId" UUID,
    "phaseName" "ExecutivePhaseName" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "executiveTrickId" UUID,

    CONSTRAINT "ExecutivePhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutiveInfluenceBid" (
    "id" UUID NOT NULL,
    "gameId" UUID NOT NULL,
    "toPlayerId" UUID NOT NULL,
    "fromPlayerId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "executiveGameTurnId" UUID NOT NULL,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ExecutiveInfluenceBid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutiveInfluenceVoteRound" (
    "id" UUID NOT NULL,
    "gameId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "executiveGameTurnId" UUID,

    CONSTRAINT "ExecutiveInfluenceVoteRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutivePlayerVote" (
    "id" UUID NOT NULL,
    "playerId" UUID NOT NULL,
    "influenceVoteRoundId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutivePlayerVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutiveTrick" (
    "id" UUID NOT NULL,
    "gameId" UUID NOT NULL,
    "turnId" UUID NOT NULL,
    "trickWinnerId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutiveTrick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrickCard" (
    "id" UUID NOT NULL,
    "trickId" UUID NOT NULL,
    "cardId" UUID NOT NULL,
    "gameTurnId" UUID NOT NULL,
    "playerId" UUID NOT NULL,
    "isLead" BOOLEAN NOT NULL DEFAULT false,
    "isTrump" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrickCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutivePlayer" (
    "id" UUID NOT NULL,
    "gameId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "nickname" TEXT NOT NULL DEFAULT 'executive-anon',
    "seatIndex" INTEGER NOT NULL,
    "isCOO" BOOLEAN NOT NULL DEFAULT false,
    "isGeneralCounsel" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutivePlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoteMarker" (
    "id" UUID NOT NULL,
    "gameId" UUID NOT NULL,
    "owningPlayerId" UUID NOT NULL,
    "votedPlayerId" UUID,
    "isCeo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "influenceVoteRoundId" UUID,

    CONSTRAINT "VoteMarker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutiveAgenda" (
    "id" UUID NOT NULL,
    "gameId" UUID NOT NULL,
    "playerId" UUID NOT NULL,
    "agendaType" "Agenda" NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutiveAgenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutiveVictoryPoint" (
    "id" UUID NOT NULL,
    "gameId" UUID NOT NULL,
    "playerId" UUID NOT NULL,
    "victoryPointType" "VictoryPointType" NOT NULL,
    "victoryPoint" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutiveVictoryPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Influence" (
    "id" UUID NOT NULL,
    "gameId" UUID NOT NULL,
    "selfPlayerId" UUID,
    "ownedByPlayerId" UUID,
    "influenceType" "InfluenceType" NOT NULL,
    "influenceLocation" "InfluenceLocation" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "executivePlayerVoteId" UUID,

    CONSTRAINT "Influence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfluenceBid" (
    "id" UUID NOT NULL,
    "influenceId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "executiveInfluenceBidId" UUID,

    CONSTRAINT "InfluenceBid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutiveCard" (
    "id" UUID NOT NULL,
    "gameId" UUID NOT NULL,
    "playerId" UUID,
    "cardValue" INTEGER NOT NULL,
    "cardLocation" "CardLocation" NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "cardSuit" "CardSuit" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutiveCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactoryBlueprint" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "phase" INTEGER NOT NULL,
    "size" "FactorySize" NOT NULL,
    "resourceTypes" "FactoryBlueprintType"[],
    "resourceCounts" INTEGER[],
    "slot" INTEGER NOT NULL,
    "consumers" INTEGER NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FactoryBlueprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactoryConstructionOrder" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "size" "FactorySize" NOT NULL,
    "resourceTypes" "ResourceType"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FactoryConstructionOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingCampaign" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "tier" "MarketingCampaignTier" NOT NULL,
    "workers" INTEGER NOT NULL,
    "status" "MarketingCampaignStatus" NOT NULL DEFAULT 'ACTIVE',
    "brandBonus" INTEGER NOT NULL DEFAULT 0,
    "factoryId" TEXT,

    CONSTRAINT "MarketingCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FactoryResources" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FactoryResources_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_FactoryBlueprintResources" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FactoryBlueprintResources_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShortOrder_playerOrderId_key" ON "ShortOrder"("playerOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "OptionContract_playerOrderId_key" ON "OptionContract"("playerOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "GameRecord_gameId_key" ON "GameRecord"("gameId");

-- CreateIndex
CREATE INDEX "ExecutiveGame_roomId_idx" ON "ExecutiveGame"("roomId");

-- CreateIndex
CREATE INDEX "ExecutiveGameTurn_gameId_idx" ON "ExecutiveGameTurn"("gameId");

-- CreateIndex
CREATE INDEX "ExecutiveGameTurn_turnNumber_idx" ON "ExecutiveGameTurn"("turnNumber");

-- CreateIndex
CREATE INDEX "ExecutivePlayerPass_playerId_idx" ON "ExecutivePlayerPass"("playerId");

-- CreateIndex
CREATE INDEX "ExecutivePlayerPass_gameTurnId_idx" ON "ExecutivePlayerPass"("gameTurnId");

-- CreateIndex
CREATE INDEX "ExecutivePhase_gameId_idx" ON "ExecutivePhase"("gameId");

-- CreateIndex
CREATE INDEX "ExecutivePhase_gameTurnId_idx" ON "ExecutivePhase"("gameTurnId");

-- CreateIndex
CREATE INDEX "ExecutivePhase_activePlayerId_idx" ON "ExecutivePhase"("activePlayerId");

-- CreateIndex
CREATE INDEX "ExecutivePhase_executiveTrickId_idx" ON "ExecutivePhase"("executiveTrickId");

-- CreateIndex
CREATE INDEX "ExecutiveInfluenceBid_gameId_idx" ON "ExecutiveInfluenceBid"("gameId");

-- CreateIndex
CREATE INDEX "ExecutiveInfluenceBid_toPlayerId_idx" ON "ExecutiveInfluenceBid"("toPlayerId");

-- CreateIndex
CREATE INDEX "ExecutiveInfluenceBid_fromPlayerId_idx" ON "ExecutiveInfluenceBid"("fromPlayerId");

-- CreateIndex
CREATE INDEX "ExecutiveInfluenceBid_executiveGameTurnId_idx" ON "ExecutiveInfluenceBid"("executiveGameTurnId");

-- CreateIndex
CREATE INDEX "ExecutiveInfluenceVoteRound_gameId_idx" ON "ExecutiveInfluenceVoteRound"("gameId");

-- CreateIndex
CREATE INDEX "ExecutiveInfluenceVoteRound_executiveGameTurnId_idx" ON "ExecutiveInfluenceVoteRound"("executiveGameTurnId");

-- CreateIndex
CREATE INDEX "ExecutivePlayerVote_playerId_idx" ON "ExecutivePlayerVote"("playerId");

-- CreateIndex
CREATE INDEX "ExecutivePlayerVote_influenceVoteRoundId_idx" ON "ExecutivePlayerVote"("influenceVoteRoundId");

-- CreateIndex
CREATE INDEX "ExecutiveTrick_gameId_idx" ON "ExecutiveTrick"("gameId");

-- CreateIndex
CREATE INDEX "ExecutiveTrick_turnId_idx" ON "ExecutiveTrick"("turnId");

-- CreateIndex
CREATE INDEX "ExecutiveTrick_trickWinnerId_idx" ON "ExecutiveTrick"("trickWinnerId");

-- CreateIndex
CREATE INDEX "TrickCard_trickId_idx" ON "TrickCard"("trickId");

-- CreateIndex
CREATE INDEX "TrickCard_cardId_idx" ON "TrickCard"("cardId");

-- CreateIndex
CREATE INDEX "TrickCard_gameTurnId_idx" ON "TrickCard"("gameTurnId");

-- CreateIndex
CREATE INDEX "TrickCard_playerId_idx" ON "TrickCard"("playerId");

-- CreateIndex
CREATE INDEX "ExecutivePlayer_gameId_idx" ON "ExecutivePlayer"("gameId");

-- CreateIndex
CREATE INDEX "ExecutivePlayer_userId_idx" ON "ExecutivePlayer"("userId");

-- CreateIndex
CREATE INDEX "ExecutivePlayer_seatIndex_idx" ON "ExecutivePlayer"("seatIndex");

-- CreateIndex
CREATE INDEX "VoteMarker_gameId_idx" ON "VoteMarker"("gameId");

-- CreateIndex
CREATE INDEX "VoteMarker_owningPlayerId_idx" ON "VoteMarker"("owningPlayerId");

-- CreateIndex
CREATE INDEX "VoteMarker_votedPlayerId_idx" ON "VoteMarker"("votedPlayerId");

-- CreateIndex
CREATE INDEX "VoteMarker_influenceVoteRoundId_idx" ON "VoteMarker"("influenceVoteRoundId");

-- CreateIndex
CREATE INDEX "ExecutiveAgenda_gameId_idx" ON "ExecutiveAgenda"("gameId");

-- CreateIndex
CREATE INDEX "ExecutiveAgenda_playerId_idx" ON "ExecutiveAgenda"("playerId");

-- CreateIndex
CREATE INDEX "ExecutiveVictoryPoint_gameId_idx" ON "ExecutiveVictoryPoint"("gameId");

-- CreateIndex
CREATE INDEX "ExecutiveVictoryPoint_playerId_idx" ON "ExecutiveVictoryPoint"("playerId");

-- CreateIndex
CREATE INDEX "Influence_gameId_idx" ON "Influence"("gameId");

-- CreateIndex
CREATE INDEX "Influence_selfPlayerId_idx" ON "Influence"("selfPlayerId");

-- CreateIndex
CREATE INDEX "Influence_ownedByPlayerId_idx" ON "Influence"("ownedByPlayerId");

-- CreateIndex
CREATE INDEX "Influence_executivePlayerVoteId_idx" ON "Influence"("executivePlayerVoteId");

-- CreateIndex
CREATE INDEX "InfluenceBid_influenceId_idx" ON "InfluenceBid"("influenceId");

-- CreateIndex
CREATE INDEX "InfluenceBid_executiveInfluenceBidId_idx" ON "InfluenceBid"("executiveInfluenceBidId");

-- CreateIndex
CREATE INDEX "ExecutiveCard_gameId_idx" ON "ExecutiveCard"("gameId");

-- CreateIndex
CREATE INDEX "ExecutiveCard_playerId_idx" ON "ExecutiveCard"("playerId");

-- CreateIndex
CREATE INDEX "_FactoryResources_B_index" ON "_FactoryResources"("B");

-- CreateIndex
CREATE INDEX "_FactoryBlueprintResources_B_index" ON "_FactoryBlueprintResources"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Company_entityId_key" ON "Company"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_entityId_key" ON "Player"("entityId");

-- CreateIndex
CREATE INDEX "RoomMessage_userId_idx" ON "RoomMessage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomUser_playerId_key" ON "RoomUser"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_authUserId_key" ON "User"("authUserId");

-- AddForeignKey
ALTER TABLE "RoomMessage" ADD CONSTRAINT "RoomMessage_userId_roomId_fkey" FOREIGN KEY ("userId", "roomId") REFERENCES "RoomUser"("userId", "roomId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomUser" ADD CONSTRAINT "RoomUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomUser" ADD CONSTRAINT "RoomUser_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Share" ADD CONSTRAINT "Share_shortOrderId_fkey" FOREIGN KEY ("shortOrderId") REFERENCES "ShortOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Share" ADD CONSTRAINT "Share_optionContractId_fkey" FOREIGN KEY ("optionContractId") REFERENCES "OptionContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Share" ADD CONSTRAINT "Share_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Share" ADD CONSTRAINT "Share_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Share" ADD CONSTRAINT "Share_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factory" ADD CONSTRAINT "Factory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factory" ADD CONSTRAINT "Factory_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factory" ADD CONSTRAINT "Factory_blueprintId_fkey" FOREIGN KEY ("blueprintId") REFERENCES "FactoryBlueprint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_ceoId_fkey" FOREIGN KEY ("ceoId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyIpoPriceVote" ADD CONSTRAINT "CompanyIpoPriceVote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyIpoPriceVote" ADD CONSTRAINT "CompanyIpoPriceVote_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyIpoPriceVote" ADD CONSTRAINT "CompanyIpoPriceVote_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyIpoPriceVote" ADD CONSTRAINT "CompanyIpoPriceVote_gameTurnId_fkey" FOREIGN KEY ("gameTurnId") REFERENCES "GameTurn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockHistory" ADD CONSTRAINT "StockHistory_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockHistory" ADD CONSTRAINT "StockHistory_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockHistory" ADD CONSTRAINT "StockHistory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockRound" ADD CONSTRAINT "StockRound_gameTurnId_fkey" FOREIGN KEY ("gameTurnId") REFERENCES "GameTurn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockSubRound" ADD CONSTRAINT "StockSubRound_gameTurnId_fkey" FOREIGN KEY ("gameTurnId") REFERENCES "GameTurn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockSubRound" ADD CONSTRAINT "StockSubRound_stockRoundId_fkey" FOREIGN KEY ("stockRoundId") REFERENCES "StockRound"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockSubRound" ADD CONSTRAINT "StockSubRound_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerOrder" ADD CONSTRAINT "PlayerOrder_optionContractId_fkey" FOREIGN KEY ("optionContractId") REFERENCES "OptionContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerOrder" ADD CONSTRAINT "PlayerOrder_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerOrder" ADD CONSTRAINT "PlayerOrder_stockRoundId_fkey" FOREIGN KEY ("stockRoundId") REFERENCES "StockRound"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerOrder" ADD CONSTRAINT "PlayerOrder_stockSubRoundId_fkey" FOREIGN KEY ("stockSubRoundId") REFERENCES "StockSubRound"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerOrder" ADD CONSTRAINT "PlayerOrder_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerOrder" ADD CONSTRAINT "PlayerOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerOrder" ADD CONSTRAINT "PlayerOrder_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerOrder" ADD CONSTRAINT "PlayerOrder_gameTurnCreated_fkey" FOREIGN KEY ("gameTurnCreated") REFERENCES "GameTurn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerOrder" ADD CONSTRAINT "PlayerOrder_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortOrder" ADD CONSTRAINT "ShortOrder_playerOrderId_fkey" FOREIGN KEY ("playerOrderId") REFERENCES "PlayerOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortOrder" ADD CONSTRAINT "ShortOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptionContract" ADD CONSTRAINT "OptionContract_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptionContract" ADD CONSTRAINT "OptionContract_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatingRound" ADD CONSTRAINT "OperatingRound_gameTurnId_fkey" FOREIGN KEY ("gameTurnId") REFERENCES "GameTurn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapitalGains" ADD CONSTRAINT "CapitalGains_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapitalGains" ADD CONSTRAINT "CapitalGains_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapitalGains" ADD CONSTRAINT "CapitalGains_gameTurnId_fkey" FOREIGN KEY ("gameTurnId") REFERENCES "GameTurn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrestigeRewards" ADD CONSTRAINT "PrestigeRewards_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrestigeRewards" ADD CONSTRAINT "PrestigeRewards_gameTurnId_fkey" FOREIGN KEY ("gameTurnId") REFERENCES "GameTurn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrestigeRewards" ADD CONSTRAINT "PrestigeRewards_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionResult" ADD CONSTRAINT "ProductionResult_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionResult" ADD CONSTRAINT "ProductionResult_operatingRoundId_fkey" FOREIGN KEY ("operatingRoundId") REFERENCES "OperatingRound"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueDistributionVote" ADD CONSTRAINT "RevenueDistributionVote_productionResultId_fkey" FOREIGN KEY ("productionResultId") REFERENCES "ProductionResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueDistributionVote" ADD CONSTRAINT "RevenueDistributionVote_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueDistributionVote" ADD CONSTRAINT "RevenueDistributionVote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueDistributionVote" ADD CONSTRAINT "RevenueDistributionVote_operatingRoundId_fkey" FOREIGN KEY ("operatingRoundId") REFERENCES "OperatingRound"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyAction" ADD CONSTRAINT "CompanyAction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyAction" ADD CONSTRAINT "CompanyAction_operatingRoundId_fkey" FOREIGN KEY ("operatingRoundId") REFERENCES "OperatingRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyAction" ADD CONSTRAINT "CompanyAction_gameTurnId_fkey" FOREIGN KEY ("gameTurnId") REFERENCES "GameTurn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsolvencyContribution" ADD CONSTRAINT "InsolvencyContribution_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsolvencyContribution" ADD CONSTRAINT "InsolvencyContribution_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsolvencyContribution" ADD CONSTRAINT "InsolvencyContribution_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsolvencyContribution" ADD CONSTRAINT "InsolvencyContribution_gameTurnId_fkey" FOREIGN KEY ("gameTurnId") REFERENCES "GameTurn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareContribution" ADD CONSTRAINT "ShareContribution_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "Share"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatingRoundVote" ADD CONSTRAINT "OperatingRoundVote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatingRoundVote" ADD CONSTRAINT "OperatingRoundVote_operatingRoundId_fkey" FOREIGN KEY ("operatingRoundId") REFERENCES "OperatingRound"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatingRoundVote" ADD CONSTRAINT "OperatingRoundVote_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "ResearchDeck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectorMarketing" ADD CONSTRAINT "SectorMarketing_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectorMarketing" ADD CONSTRAINT "SectorMarketing_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectorMarketing" ADD CONSTRAINT "SectorMarketing_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sector" ADD CONSTRAINT "Sector_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectorPriority" ADD CONSTRAINT "SectorPriority_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectorPriority" ADD CONSTRAINT "SectorPriority_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Headline" ADD CONSTRAINT "Headline_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Headline" ADD CONSTRAINT "Headline_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Headline" ADD CONSTRAINT "Headline_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerHeadline" ADD CONSTRAINT "PlayerHeadline_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerHeadline" ADD CONSTRAINT "PlayerHeadline_gameTurnId_fkey" FOREIGN KEY ("gameTurnId") REFERENCES "GameTurn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerHeadline" ADD CONSTRAINT "PlayerHeadline_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerHeadline" ADD CONSTRAINT "PlayerHeadline_headlineId_fkey" FOREIGN KEY ("headlineId") REFERENCES "Headline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameTurn" ADD CONSTRAINT "GameTurn_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyActionOrder" ADD CONSTRAINT "CompanyActionOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyActionOrder" ADD CONSTRAINT "CompanyActionOrder_gameTurnId_fkey" FOREIGN KEY ("gameTurnId") REFERENCES "GameTurn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerPriority" ADD CONSTRAINT "PlayerPriority_gameTurnId_fkey" FOREIGN KEY ("gameTurnId") REFERENCES "GameTurn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerPriority" ADD CONSTRAINT "PlayerPriority_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Phase" ADD CONSTRAINT "Phase_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Phase" ADD CONSTRAINT "Phase_operatingRoundId_fkey" FOREIGN KEY ("operatingRoundId") REFERENCES "OperatingRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Phase" ADD CONSTRAINT "Phase_stockRoundId_fkey" FOREIGN KEY ("stockRoundId") REFERENCES "StockRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Phase" ADD CONSTRAINT "Phase_stockSubRoundId_fkey" FOREIGN KEY ("stockSubRoundId") REFERENCES "StockSubRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Phase" ADD CONSTRAINT "Phase_influenceRoundId_fkey" FOREIGN KEY ("influenceRoundId") REFERENCES "InfluenceRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Phase" ADD CONSTRAINT "Phase_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Phase" ADD CONSTRAINT "Phase_gameTurnId_fkey" FOREIGN KEY ("gameTurnId") REFERENCES "GameTurn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Phase" ADD CONSTRAINT "Phase_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluenceRound" ADD CONSTRAINT "InfluenceRound_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluenceRound" ADD CONSTRAINT "InfluenceRound_gameTurnId_fkey" FOREIGN KEY ("gameTurnId") REFERENCES "GameTurn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluenceVote" ADD CONSTRAINT "InfluenceVote_influenceRoundId_fkey" FOREIGN KEY ("influenceRoundId") REFERENCES "InfluenceRound"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluenceVote" ADD CONSTRAINT "InfluenceVote_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameLog" ADD CONSTRAINT "GameLog_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameLog" ADD CONSTRAINT "GameLog_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingMessage" ADD CONSTRAINT "MeetingMessage_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingMessage" ADD CONSTRAINT "MeetingMessage_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRecord" ADD CONSTRAINT "GameRecord_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerResult" ADD CONSTRAINT "PlayerResult_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerResult" ADD CONSTRAINT "PlayerResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerResult" ADD CONSTRAINT "PlayerResult_gameRecordId_fkey" FOREIGN KEY ("gameRecordId") REFERENCES "GameRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity" ADD CONSTRAINT "Entity_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_fromEntityId_fkey" FOREIGN KEY ("fromEntityId") REFERENCES "Entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_toEntityId_fkey" FOREIGN KEY ("toEntityId") REFERENCES "Entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_companyInvolvedId_fkey" FOREIGN KEY ("companyInvolvedId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_gameTurnId_fkey" FOREIGN KEY ("gameTurnId") REFERENCES "GameTurn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionsOnShares" ADD CONSTRAINT "TransactionsOnShares_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionsOnShares" ADD CONSTRAINT "TransactionsOnShares_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "Share"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prize" ADD CONSTRAINT "Prize_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prize" ADD CONSTRAINT "Prize_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prize" ADD CONSTRAINT "Prize_gameTurnId_fkey" FOREIGN KEY ("gameTurnId") REFERENCES "GameTurn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrizeDistribution" ADD CONSTRAINT "PrizeDistribution_prizeId_fkey" FOREIGN KEY ("prizeId") REFERENCES "Prize"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrizeDistribution" ADD CONSTRAINT "PrizeDistribution_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrizeDistribution" ADD CONSTRAINT "PrizeDistribution_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrizeDistribution" ADD CONSTRAINT "PrizeDistribution_gameTurnId_fkey" FOREIGN KEY ("gameTurnId") REFERENCES "GameTurn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrizeVote" ADD CONSTRAINT "PrizeVote_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrizeVote" ADD CONSTRAINT "PrizeVote_gameTurnId_fkey" FOREIGN KEY ("gameTurnId") REFERENCES "GameTurn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrizeVote" ADD CONSTRAINT "PrizeVote_prizeId_fkey" FOREIGN KEY ("prizeId") REFERENCES "Prize"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectorPrize" ADD CONSTRAINT "SectorPrize_prizeId_fkey" FOREIGN KEY ("prizeId") REFERENCES "Prize"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectorPrize" ADD CONSTRAINT "SectorPrize_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyAwardTrack" ADD CONSTRAINT "CompanyAwardTrack_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyAwardTrackSpace" ADD CONSTRAINT "CompanyAwardTrackSpace_awardTrackId_fkey" FOREIGN KEY ("awardTrackId") REFERENCES "CompanyAwardTrack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanySpace" ADD CONSTRAINT "CompanySpace_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanySpace" ADD CONSTRAINT "CompanySpace_companyAwardTrackSpaceId_fkey" FOREIGN KEY ("companyAwardTrackSpaceId") REFERENCES "CompanyAwardTrackSpace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutiveGame" ADD CONSTRAINT "ExecutiveGame_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutiveGameTurn" ADD CONSTRAINT "ExecutiveGameTurn_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "ExecutiveGame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutivePlayerPass" ADD CONSTRAINT "ExecutivePlayerPass_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "ExecutivePlayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutivePlayerPass" ADD CONSTRAINT "ExecutivePlayerPass_gameTurnId_fkey" FOREIGN KEY ("gameTurnId") REFERENCES "ExecutiveGameTurn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutivePhase" ADD CONSTRAINT "ExecutivePhase_activePlayerId_fkey" FOREIGN KEY ("activePlayerId") REFERENCES "ExecutivePlayer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutivePhase" ADD CONSTRAINT "ExecutivePhase_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "ExecutiveGame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutivePhase" ADD CONSTRAINT "ExecutivePhase_gameTurnId_fkey" FOREIGN KEY ("gameTurnId") REFERENCES "ExecutiveGameTurn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutivePhase" ADD CONSTRAINT "ExecutivePhase_executiveTrickId_fkey" FOREIGN KEY ("executiveTrickId") REFERENCES "ExecutiveTrick"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutiveInfluenceBid" ADD CONSTRAINT "ExecutiveInfluenceBid_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "ExecutiveGame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutiveInfluenceBid" ADD CONSTRAINT "ExecutiveInfluenceBid_toPlayerId_fkey" FOREIGN KEY ("toPlayerId") REFERENCES "ExecutivePlayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutiveInfluenceBid" ADD CONSTRAINT "ExecutiveInfluenceBid_fromPlayerId_fkey" FOREIGN KEY ("fromPlayerId") REFERENCES "ExecutivePlayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutiveInfluenceBid" ADD CONSTRAINT "ExecutiveInfluenceBid_executiveGameTurnId_fkey" FOREIGN KEY ("executiveGameTurnId") REFERENCES "ExecutiveGameTurn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutiveInfluenceVoteRound" ADD CONSTRAINT "ExecutiveInfluenceVoteRound_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "ExecutiveGame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutiveInfluenceVoteRound" ADD CONSTRAINT "ExecutiveInfluenceVoteRound_executiveGameTurnId_fkey" FOREIGN KEY ("executiveGameTurnId") REFERENCES "ExecutiveGameTurn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutivePlayerVote" ADD CONSTRAINT "ExecutivePlayerVote_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "ExecutivePlayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutivePlayerVote" ADD CONSTRAINT "ExecutivePlayerVote_influenceVoteRoundId_fkey" FOREIGN KEY ("influenceVoteRoundId") REFERENCES "ExecutiveInfluenceVoteRound"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutiveTrick" ADD CONSTRAINT "ExecutiveTrick_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "ExecutiveGame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutiveTrick" ADD CONSTRAINT "ExecutiveTrick_turnId_fkey" FOREIGN KEY ("turnId") REFERENCES "ExecutiveGameTurn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutiveTrick" ADD CONSTRAINT "ExecutiveTrick_trickWinnerId_fkey" FOREIGN KEY ("trickWinnerId") REFERENCES "ExecutivePlayer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrickCard" ADD CONSTRAINT "TrickCard_trickId_fkey" FOREIGN KEY ("trickId") REFERENCES "ExecutiveTrick"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrickCard" ADD CONSTRAINT "TrickCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "ExecutiveCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrickCard" ADD CONSTRAINT "TrickCard_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "ExecutivePlayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutivePlayer" ADD CONSTRAINT "ExecutivePlayer_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "ExecutiveGame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutivePlayer" ADD CONSTRAINT "ExecutivePlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteMarker" ADD CONSTRAINT "VoteMarker_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "ExecutiveGame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteMarker" ADD CONSTRAINT "VoteMarker_owningPlayerId_fkey" FOREIGN KEY ("owningPlayerId") REFERENCES "ExecutivePlayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteMarker" ADD CONSTRAINT "VoteMarker_votedPlayerId_fkey" FOREIGN KEY ("votedPlayerId") REFERENCES "ExecutivePlayer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteMarker" ADD CONSTRAINT "VoteMarker_influenceVoteRoundId_fkey" FOREIGN KEY ("influenceVoteRoundId") REFERENCES "ExecutiveInfluenceVoteRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutiveAgenda" ADD CONSTRAINT "ExecutiveAgenda_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "ExecutiveGame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutiveAgenda" ADD CONSTRAINT "ExecutiveAgenda_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "ExecutivePlayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutiveVictoryPoint" ADD CONSTRAINT "ExecutiveVictoryPoint_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "ExecutiveGame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutiveVictoryPoint" ADD CONSTRAINT "ExecutiveVictoryPoint_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "ExecutivePlayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Influence" ADD CONSTRAINT "Influence_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "ExecutiveGame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Influence" ADD CONSTRAINT "Influence_selfPlayerId_fkey" FOREIGN KEY ("selfPlayerId") REFERENCES "ExecutivePlayer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Influence" ADD CONSTRAINT "Influence_ownedByPlayerId_fkey" FOREIGN KEY ("ownedByPlayerId") REFERENCES "ExecutivePlayer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Influence" ADD CONSTRAINT "Influence_executivePlayerVoteId_fkey" FOREIGN KEY ("executivePlayerVoteId") REFERENCES "ExecutivePlayerVote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluenceBid" ADD CONSTRAINT "InfluenceBid_influenceId_fkey" FOREIGN KEY ("influenceId") REFERENCES "Influence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluenceBid" ADD CONSTRAINT "InfluenceBid_executiveInfluenceBidId_fkey" FOREIGN KEY ("executiveInfluenceBidId") REFERENCES "ExecutiveInfluenceBid"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutiveCard" ADD CONSTRAINT "ExecutiveCard_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "ExecutiveGame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutiveCard" ADD CONSTRAINT "ExecutiveCard_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "ExecutivePlayer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactoryBlueprint" ADD CONSTRAINT "FactoryBlueprint_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactoryBlueprint" ADD CONSTRAINT "FactoryBlueprint_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactoryConstructionOrder" ADD CONSTRAINT "FactoryConstructionOrder_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactoryConstructionOrder" ADD CONSTRAINT "FactoryConstructionOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactoryConstructionOrder" ADD CONSTRAINT "FactoryConstructionOrder_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactoryConstructionOrder" ADD CONSTRAINT "FactoryConstructionOrder_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingCampaign" ADD CONSTRAINT "MarketingCampaign_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingCampaign" ADD CONSTRAINT "MarketingCampaign_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingCampaign" ADD CONSTRAINT "MarketingCampaign_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FactoryResources" ADD CONSTRAINT "_FactoryResources_A_fkey" FOREIGN KEY ("A") REFERENCES "Factory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FactoryResources" ADD CONSTRAINT "_FactoryResources_B_fkey" FOREIGN KEY ("B") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FactoryBlueprintResources" ADD CONSTRAINT "_FactoryBlueprintResources_A_fkey" FOREIGN KEY ("A") REFERENCES "FactoryBlueprint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FactoryBlueprintResources" ADD CONSTRAINT "_FactoryBlueprintResources_B_fkey" FOREIGN KEY ("B") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
