/*
  Warnings:

  - You are about to drop the column `quantity` on the `Resource` table. All the data in the column will be lost.
  - Added the required column `trackPosition` to the `Resource` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Resource" DROP COLUMN "quantity",
ADD COLUMN     "trackPosition" INTEGER NOT NULL;
