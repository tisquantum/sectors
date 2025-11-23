/*
  Warnings:

  - Added the required column `slot` to the `Factory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Factory" ADD COLUMN     "slot" INTEGER NOT NULL;
