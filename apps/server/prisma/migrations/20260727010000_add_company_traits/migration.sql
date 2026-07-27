-- CreateEnum
CREATE TYPE "CompanyTraitType" AS ENUM ('SUPPLY_CONTRACT', 'PREMIUM_LINE', 'MARKET_DARLING', 'HIGH_CAPACITY', 'EFFICIENT_TOOLING', 'SIGNATURE_PRODUCT');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "traitType" "CompanyTraitType",
ADD COLUMN     "traitResource" "ResourceType";
