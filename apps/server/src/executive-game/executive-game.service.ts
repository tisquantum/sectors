import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, ExecutiveGame } from '@prisma/client';
import { ExecutiveGameWithRelations } from '@server/prisma/prisma.types';

@Injectable()
export class ExecutiveGameService {
  private inputLockCache = new Map<string, boolean>();
  private gameCache = new Map<string, ExecutiveGameWithRelations>();
  private updateQueue: {
    gameId: string;
    data: Prisma.ExecutiveGameUpdateInput;
  }[] = [];
  private batchTimer: NodeJS.Timeout | null = null;

  constructor(private prisma: PrismaService) {}

  async createExecutiveGame(
    data: Prisma.ExecutiveGameCreateInput,
  ): Promise<ExecutiveGameWithRelations> {
    // Create a new game in the database
    const game = await this.prisma.executiveGame.create({
      data,
      include: {
        players: true,
        influence: true,
        ExecutiveVictoryPoint: true,
        ExecutiveAgenda: true,
        phases: true,
        gameTurn: true,
      },
    });
  
    // Cache the newly created game
    this.gameCache.set(game.id, game);
  
    return game;
  }

  async listExecutiveGames(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ExecutiveGameWhereUniqueInput;
    where?: Prisma.ExecutiveGameWhereInput;
    orderBy?: Prisma.ExecutiveGameOrderByWithRelationInput;
  }): Promise<ExecutiveGameWithRelations[]> {
    const { skip, take, cursor, where, orderBy } = params;
  
    // Fetch games from the database with all required relations
    const games = await this.prisma.executiveGame.findMany({
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
        phases: true, // Include phases
        gameTurn: true, // Include gameTurn
      },
    });
  
    // Update cache with the fetched games
    games.forEach((game) => {
      this.gameCache.set(game.id, game);
    });
  
    return games;
  }
  
  // Retrieve a specific ExecutiveGame
  async getExecutiveGame(
    executiveGameWhereUniqueInput: Prisma.ExecutiveGameWhereUniqueInput,
  ): Promise<ExecutiveGameWithRelations | null> {
    const gameId = executiveGameWhereUniqueInput.id;

    if (!gameId) {
      return null;
    }
    // Check in-memory cache
    if (this.gameCache.has(gameId)) {
      return this.gameCache.get(gameId) || null;
    }

    // Fetch from database if not cached
    const game = await this.prisma.executiveGame.findUnique({
      where: executiveGameWhereUniqueInput,
      include: {
        players: true,
        influence: true,
        ExecutiveVictoryPoint: true,
        ExecutiveAgenda: true,
        phases: true,
        gameTurn: true,
      },
    });

    if (game) {
      this.gameCache.set(gameId, game);
    }

    return game;
  }

  // Update an existing ExecutiveGame
  async updateExecutiveGame(params: {
    where: Prisma.ExecutiveGameWhereUniqueInput;
    data: Prisma.ExecutiveGameUpdateInput;
  }): Promise<void> {
    const { where, data } = params;
    const gameId = where.id;
    if (!gameId) {
      return;
    }
    // Update in-memory cache
    if (this.gameCache.has(gameId)) {
      const currentGame = this.gameCache.get(gameId);
      this.gameCache.set(gameId, {
        ...currentGame,
        ...data,
      } as ExecutiveGameWithRelations);
    }

    // Enqueue update for background persistence
    this.enqueueUpdate(gameId, data);
  }

  // Enqueue updates for batch persistence
  private enqueueUpdate(gameId: string, data: Prisma.ExecutiveGameUpdateInput) {
    this.updateQueue.push({ gameId, data });

    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.persistUpdates(), 1000); // Batch every second
    }
  }

  // Persist updates to the database
  private async persistUpdates() {
    const updates = [...this.updateQueue];
    this.updateQueue = [];

    const updatePromises = updates.map(({ gameId, data }) =>
      this.prisma.executiveGame.update({
        where: { id: gameId },
        data,
      }),
    );

    try {
      await Promise.all(updatePromises);
      console.log('Updates persisted to database:', updates);
    } catch (error) {
      console.error('Failed to persist updates:', error);
    }

    // Clear the timer
    this.batchTimer = null;
  }

  // Clear cache for a specific game (e.g., after deletion)
  clearCache(gameId: string): void {
    this.gameCache.delete(gameId);
  }

  // Other CRUD methods remain unchanged...

  checkLock(gameId: string): boolean {
    return this.inputLockCache.get(gameId) || false;
  }

  lockInput(gameId: string): void {
    this.inputLockCache.set(gameId, true);
  }

  checkLockAndLock(gameId: string): boolean {
    if (this.checkLock(gameId)) {
      return true;
    }
    this.lockInput(gameId);
    return false;
  }

  unlockInput(gameId: string): void {
    this.inputLockCache.delete(gameId);
  }
}
