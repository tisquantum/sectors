-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PhaseName" ADD VALUE 'FORECAST_COMMITMENT_END_TURN';
ALTER TYPE "PhaseName" ADD VALUE 'FORECAST_RESOLVE';
ALTER TYPE "PhaseName" ADD VALUE 'FORECAST_COMMITMENT_START_TURN';
