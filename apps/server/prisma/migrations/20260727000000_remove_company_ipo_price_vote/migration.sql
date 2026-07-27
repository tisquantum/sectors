-- DropForeignKey
ALTER TABLE "CompanyIpoPriceVote" DROP CONSTRAINT IF EXISTS "CompanyIpoPriceVote_companyId_fkey";

-- DropForeignKey
ALTER TABLE "CompanyIpoPriceVote" DROP CONSTRAINT IF EXISTS "CompanyIpoPriceVote_gameId_fkey";

-- DropForeignKey
ALTER TABLE "CompanyIpoPriceVote" DROP CONSTRAINT IF EXISTS "CompanyIpoPriceVote_gameTurnId_fkey";

-- DropForeignKey
ALTER TABLE "CompanyIpoPriceVote" DROP CONSTRAINT IF EXISTS "CompanyIpoPriceVote_playerId_fkey";

-- DropTable
DROP TABLE IF EXISTS "CompanyIpoPriceVote";
