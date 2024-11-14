import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, ExecutiveGame } from '@prisma/client';
import { ExecutiveGameWithRelations } from '@server/prisma/prisma.types';

@Injectable()
export class ExecutiveGameService {
  //lock input for gameId
  private inputLockCache = new Map<string, boolean>();
  constructor(private prisma: PrismaService) {}

  // Retrieve a specific ExecutiveGame by unique input
  async getExecutiveGame(
    executiveGameWhereUniqueInput: Prisma.ExecutiveGameWhereUniqueInput,
  ): Promise<ExecutiveGameWithRelations | null> {
    return this.prisma.executiveGame.findUnique({
      where: executiveGameWhereUniqueInput,
      include: {
        players: true,
        executiveCards: true,
        influence: true,
        ExecutiveVictoryPoint: true,
        ExecutiveAgenda: true,
        phases: true,
        gameTurn: true
      },
    });
  }

  // List all ExecutiveGames with optional filtering, pagination, and sorting
  async listExecutiveGames(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ExecutiveGameWhereUniqueInput;
    where?: Prisma.ExecutiveGameWhereInput;
    orderBy?: Prisma.ExecutiveGameOrderByWithRelationInput;
  }): Promise<ExecutiveGame[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.executiveGame.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        players: true,
        executiveCards: true,
        influence: true,
        ExecutiveVictoryPoint: true,
        ExecutiveAgenda: true,
      },
    });
  }

  // Create a new ExecutiveGame
  async createExecutiveGame(data: Prisma.ExecutiveGameCreateInput): Promise<ExecutiveGame> {
    return this.prisma.executiveGame.create({
      data,
    });
  }

  // Create multiple ExecutiveGames
  async createManyExecutiveGames(
    data: Prisma.ExecutiveGameCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.executiveGame.createMany({
      data,
      skipDuplicates: true,
    });
  }

  // Update an existing ExecutiveGame
  async updateExecutiveGame(params: {
    where: Prisma.ExecutiveGameWhereUniqueInput;
    data: Prisma.ExecutiveGameUpdateInput;
  }): Promise<ExecutiveGame> {
    const { where, data } = params;
    return this.prisma.executiveGame.update({
      data,
      where,
    });
  }

  // Delete an ExecutiveGame
  async deleteExecutiveGame(
    where: Prisma.ExecutiveGameWhereUniqueInput,
  ): Promise<ExecutiveGame> {
    return this.prisma.executiveGame.delete({
      where,
    });
  }

  checkLock(gameId: string): boolean {
    return this.inputLockCache.get(gameId) || false;
  }

  lockInput(gameId: string): void {
    this.inputLockCache.set(gameId, true);
  }

  checkLockAndLock(gameId: string): boolean {
    if (this.checkLock(gameId)) {
      return false;
    }
    this.lockInput(gameId);
    return true;
  }

  unlockInput(gameId: string): void {
    this.inputLockCache.delete(gameId);
  }
}
