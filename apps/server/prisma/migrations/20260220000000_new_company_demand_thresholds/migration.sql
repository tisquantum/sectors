-- AlterTable
ALTER TABLE "Sector" ADD COLUMN "demandThreshold2Reached" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Sector" ADD COLUMN "demandThreshold4Reached" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Sector" ADD COLUMN "demandThreshold8Reached" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Sector" ADD COLUMN "pendingNewCompanyAt2" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Sector" ADD COLUMN "pendingNewCompanyAt4" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Sector" ADD COLUMN "pendingNewCompanyAt8" BOOLEAN NOT NULL DEFAULT false;
