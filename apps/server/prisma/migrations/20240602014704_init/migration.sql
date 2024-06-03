/*
  Warnings:

  - The primary key for the `OperatingRound` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `OperatingRound` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `ResearchDeck` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `ResearchDeck` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Room` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Room` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `RoomUser` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `StockHistory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `StockHistory` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `StockRound` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `StockRound` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `roomId` on the `RoomMessage` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `roomId` on the `RoomUser` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "RoomMessage" DROP CONSTRAINT "RoomMessage_roomId_fkey";

-- DropForeignKey
ALTER TABLE "RoomUser" DROP CONSTRAINT "RoomUser_roomId_fkey";

-- AlterTable
ALTER TABLE "OperatingRound" DROP CONSTRAINT "OperatingRound_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "OperatingRound_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ResearchDeck" DROP CONSTRAINT "ResearchDeck_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "ResearchDeck_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Room" DROP CONSTRAINT "Room_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Room_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "RoomMessage" DROP COLUMN "roomId",
ADD COLUMN     "roomId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "RoomUser" DROP CONSTRAINT "RoomUser_pkey",
DROP COLUMN "roomId",
ADD COLUMN     "roomId" INTEGER NOT NULL,
ADD CONSTRAINT "RoomUser_pkey" PRIMARY KEY ("userId", "roomId");

-- AlterTable
ALTER TABLE "StockHistory" DROP CONSTRAINT "StockHistory_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "StockHistory_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "StockRound" DROP CONSTRAINT "StockRound_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "StockRound_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "RoomMessage_roomId_idx" ON "RoomMessage"("roomId");

-- AddForeignKey
ALTER TABLE "RoomMessage" ADD CONSTRAINT "RoomMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomUser" ADD CONSTRAINT "RoomUser_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
