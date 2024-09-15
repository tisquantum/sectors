import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Game, Prisma } from '@prisma/client';
import {
  GameState,
  GameWithGameTurns,
  GameWithPhase,
} from '@server/prisma/prisma.types';

@Injectable()
export class GamesService {
  constructor(private prisma: PrismaService) {}

  async game(
    gameWhereUniqueInput: Prisma.GameWhereUniqueInput,
  ): Promise<GameWithGameTurns | null> {
    return this.prisma.game.findUnique({
      where: gameWhereUniqueInput,
      include: {
        GameTurn: true,
      },
    });
  }

  async gameWithPhase(
    gameWhereUniqueInput: Prisma.GameWhereUniqueInput,
  ): Promise<GameWithPhase | null> {
    return this.prisma.game.findUnique({
      where: gameWhereUniqueInput,
      include: {
        Phase: true,
      },
    });
  }

  async games(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.GameWhereUniqueInput;
    where?: Prisma.GameWhereInput;
    orderBy?: Prisma.GameOrderByWithRelationInput;
  }): Promise<Game[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.game.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createGame(data: Prisma.GameCreateInput): Promise<Game> {
    return this.prisma.game.create({
      data,
    });
  }

  async updateGame(params: {
    where: Prisma.GameWhereUniqueInput;
    data: Prisma.GameUpdateInput;
  }): Promise<Game> {
    const { where, data } = params;
    return this.prisma.game.update({
      data,
      where,
    });
  }

  async deleteGame(where: Prisma.GameWhereUniqueInput): Promise<Game> {
    return this.prisma.game.delete({
      where,
    });
  }

  async getGameState(gameId: string): Promise<GameState | null> {
    return this.prisma.game.findUnique({
      where: {
        id: gameId,
      },
      include: {
        Player: true,
        Company: true,
        gameLogs: true,
        sectors: true,
        OperatingRound: true,
        StockRound: true,
        InfluenceRound: true,
        Phase: true,
        GameRecord: true,
        sectorPriority: true,
      },
    });
  }

  async updateGameState(params: {
    where: Prisma.GameWhereUniqueInput;
    data: Prisma.GameUpdateInput;
  }): Promise<GameState> {
    const { where, data } = params;
    return this.prisma.game.update({
      data,
      where,
      include: {
        Player: true,
        Company: true,
        gameLogs: true,
        sectors: true,
        OperatingRound: true,
        StockRound: true,
        InfluenceRound: {
          include: {
            InfluenceVotes: {
              include: {
                Player: true,
              },
            },
          },
        },
        Phase: true,
        GameRecord: true,
        sectorPriority: true,
      },
    });
  }
}
