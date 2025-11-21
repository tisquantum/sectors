import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Game, Prisma, Resource } from '@prisma/client';
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

  private getGameStateCallCount = new Map<string, number>();
  private getGameStateLastCallTime = new Map<string, number>();

  async getGameState(gameId: string): Promise<GameState | null> {
    const callCount = (this.getGameStateCallCount.get(gameId) || 0) + 1;
    this.getGameStateCallCount.set(gameId, callCount);
    
    const now = Date.now();
    const lastCallTime = this.getGameStateLastCallTime.get(gameId) || 0;
    const timeSinceLastCall = now - lastCallTime;
    this.getGameStateLastCallTime.set(gameId, now);
    
    if (callCount % 10 === 0 || callCount > 20) {
      console.warn(`[GamesService] getGameState called ${callCount} times for gameId: ${gameId} (${timeSinceLastCall}ms since last call)`);
    }
    
    if (callCount > 100) {
      console.error(`[GamesService] POTENTIAL INFINITE LOOP: getGameState called ${callCount} times for gameId: ${gameId}!`);
    }
    
    if (timeSinceLastCall < 100 && callCount > 5) {
      console.error(`[GamesService] RAPID CALLS DETECTED: getGameState called ${callCount} times, only ${timeSinceLastCall}ms since last call for gameId: ${gameId}`);
    }
    
    const result = await this.prisma.game.findUnique({
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
    
    console.log(`[GamesService] getGameState completed for gameId: ${gameId}, result size: ${JSON.stringify(result).length} bytes`);
    
    return result;
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

  async isTimerless(gameId: string): Promise<boolean> {
    const game = await this.prisma.game.findUnique({
      where: {
        id: gameId,
      },
    });
    return game?.isTimerless || false;
  }

  async getResources(gameId: string): Promise<Resource[]> {
    return this.prisma.resource.findMany({
      where: {
        gameId,
      },
    });
  }
}
