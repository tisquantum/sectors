import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, GameLog } from '@prisma/client';

@Injectable()
export class GameLogService {
  constructor(private prisma: PrismaService) {}

  async gameLog(
    gameLogWhereUniqueInput: Prisma.GameLogWhereUniqueInput,
  ): Promise<GameLog | null> {
    return this.prisma.gameLog.findUnique({
      where: gameLogWhereUniqueInput,
    });
  }

  async gameLogs(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.GameLogWhereUniqueInput;
    where?: Prisma.GameLogWhereInput;
    orderBy?: Prisma.GameLogOrderByWithRelationInput;
  }): Promise<GameLog[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.gameLog.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createGameLog(data: Prisma.GameLogCreateInput): Promise<GameLog> {
    return this.prisma.gameLog.create({
      data,
    });
  }

  async createManyGameLogs(data: Prisma.GameLogCreateManyInput[]): Promise<Prisma.BatchPayload> {
    return this.prisma.gameLog.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async updateGameLog(params: {
    where: Prisma.GameLogWhereUniqueInput;
    data: Prisma.GameLogUpdateInput;
  }): Promise<GameLog> {
    const { where, data } = params;
    return this.prisma.gameLog.update({
      data,
      where,
    });
  }

  async deleteGameLog(where: Prisma.GameLogWhereUniqueInput): Promise<GameLog> {
    return this.prisma.gameLog.delete({
      where,
    });
  }
}
