import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Adjust the path as necessary
import { Prisma, GameRecord } from '@prisma/client';

@Injectable()
export class GameRecordService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a new game record
  async createGameRecord(data: Prisma.GameRecordCreateInput): Promise<GameRecord> {
    return this.prisma.gameRecord.create({
      data,
    });
  }

  // Get a game record by ID
  async getGameRecordById(id: string): Promise<GameRecord | null> {
    return this.prisma.gameRecord.findUnique({
      where: { id },
    });
  }

  // Update a game record by ID
  async updateGameRecord(id: string, data: Prisma.GameRecordUpdateInput): Promise<GameRecord> {
    return this.prisma.gameRecord.update({
      where: { id },
      data,
    });
  }

  // Delete a game record by ID
  async deleteGameRecord(id: string): Promise<GameRecord> {
    return this.prisma.gameRecord.delete({
      where: { id },
    });
  }

  // Get all game records
  async getAllGameRecords(): Promise<GameRecord[]> {
    return this.prisma.gameRecord.findMany();
  }
}
