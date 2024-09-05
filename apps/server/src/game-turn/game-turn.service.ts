import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, GameTurn } from '@prisma/client';
import { GameTurnWithRelations } from '@server/prisma/prisma.types';

@Injectable()
export class GameTurnService {
  constructor(private prisma: PrismaService) {}

  async gameTurn(
    gameTurnWhereUniqueInput: Prisma.GameTurnWhereUniqueInput,
  ): Promise<GameTurn | null> {
    return this.prisma.gameTurn.findUnique({
      where: gameTurnWhereUniqueInput,
    });
  }

  async getCurrentTurn(gameId: string): Promise<GameTurn | null> {
    return this.prisma.gameTurn.findFirst({
      where: {
        gameId: gameId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getCurrentTurnWithRelations(
    gameId: string,
  ): Promise<GameTurnWithRelations | null> {
    return this.prisma.gameTurn.findFirst({
      where: {
        gameId: gameId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        companyActions: true,
        companyActionOrder: true,
      },
    });
  }

  async gameTurns(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.GameTurnWhereUniqueInput;
    where?: Prisma.GameTurnWhereInput;
    orderBy?: Prisma.GameTurnOrderByWithRelationInput;
  }): Promise<GameTurnWithRelations[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.gameTurn.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        companyActions: true,
      },
    });
  }

  async createGameTurn(data: Prisma.GameTurnCreateInput): Promise<GameTurn> {
    return this.prisma.gameTurn.create({
      data,
    });
  }

  async createManyGameTurns(
    data: Prisma.GameTurnCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.gameTurn.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async updateGameTurn(params: {
    where: Prisma.GameTurnWhereUniqueInput;
    data: Prisma.GameTurnUpdateInput;
  }): Promise<GameTurn> {
    const { where, data } = params;
    return this.prisma.gameTurn.update({
      data,
      where,
    });
  }

  async deleteGameTurn(
    where: Prisma.GameTurnWhereUniqueInput,
  ): Promise<GameTurn> {
    return this.prisma.gameTurn.delete({
      where,
    });
  }
}
