import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, ExecutiveGameTurn } from '@prisma/client';
import { ExecutiveGameTurnWithRelations } from '@server/prisma/prisma.types';

@Injectable()
export class ExecutiveGameTurnService {
  private turnCache = new Map<string, ExecutiveGameTurnWithRelations[]>(); // Cache by gameId

  constructor(private prisma: PrismaService) {}

  // Retrieve a specific ExecutiveGameTurn by unique input
  async getExecutiveGameTurn(
    executiveGameTurnWhereUniqueInput: Prisma.ExecutiveGameTurnWhereUniqueInput,
  ): Promise<ExecutiveGameTurnWithRelations | null> {
    const turn = await this.prisma.executiveGameTurn.findUnique({
      where: executiveGameTurnWhereUniqueInput,
      include: {
        phases: true,
        tricks: {
          include: {
            trickCards: {
              include: {
                card: true,
                player: true,
              },
            },
          },
        },
        influenceBids: true,
        influenceVotes: true,
        playerPasses: true,
      },
    });

    return turn;
  }

  async getLatestTurnNoRelations(
    gameId: string,
  ): Promise<ExecutiveGameTurn | null> {
    return this.prisma.executiveGameTurn.findFirst({
      where: { gameId },
      orderBy: { turnNumber: 'desc' },
    });
  }

  // List all ExecutiveGameTurns with optional filtering, pagination, and sorting
  async listExecutiveGameTurns(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ExecutiveGameTurnWhereUniqueInput;
    where?: Prisma.ExecutiveGameTurnWhereInput;
    orderBy?: Prisma.ExecutiveGameTurnOrderByWithRelationInput;
  }): Promise<ExecutiveGameTurnWithRelations[]> {
    const { skip, take, cursor, where, orderBy } = params;

    return this.prisma.executiveGameTurn.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        phases: true,
        tricks: {
          include: {
            trickCards: {
              include: {
                card: true,
                player: true,
              },
            },
          },
        },
        influenceBids: true,
        influenceVotes: true,
        playerPasses: true,
      },
    });
  }

  // Create a new ExecutiveGameTurn
  async createExecutiveGameTurn(
    data: Prisma.ExecutiveGameTurnCreateInput,
  ): Promise<ExecutiveGameTurnWithRelations> {
    const turn = await this.prisma.executiveGameTurn.create({
      data,
      include: {
        phases: true,
        tricks: {
          include: {
            trickCards: {
              include: {
                card: true, // Include card to satisfy TrickCardWithRelations
                player: true, // Include player to satisfy TrickCardWithRelations
              },
            },
          },
        },
        influenceBids: true,
        influenceVotes: true,
        playerPasses: true,
      },
    });

    // Update the cache
    this.addToCache(turn.gameId, turn);

    return turn;
  }

  // Update an existing ExecutiveGameTurn
  // Update an existing ExecutiveGameTurn
  async updateExecutiveGameTurn(params: {
    where: Prisma.ExecutiveGameTurnWhereUniqueInput;
    data: Prisma.ExecutiveGameTurnUpdateInput;
  }): Promise<ExecutiveGameTurnWithRelations> {
    const { where, data } = params;

    const updatedTurn = await this.prisma.executiveGameTurn.update({
      where,
      data,
      include: {
        phases: true,
        tricks: {
          include: {
            trickCards: {
              include: {
                card: true,
                player: true,
              },
            },
          },
        },
        influenceBids: true,
        influenceVotes: true,
        playerPasses: true,
      },
    });

    // Update the cache
    if (updatedTurn.gameId) {
      const turns = this.turnCache.get(updatedTurn.gameId) || [];
      this.turnCache.set(
        updatedTurn.gameId,
        turns.map((turn) => (turn.id === updatedTurn.id ? updatedTurn : turn)),
      );
    }

    return updatedTurn;
  }

  // Delete an ExecutiveGameTurn
  async deleteExecutiveGameTurn(
    where: Prisma.ExecutiveGameTurnWhereUniqueInput,
  ): Promise<ExecutiveGameTurn> {
    const deletedTurn = await this.prisma.executiveGameTurn.delete({
      where,
    });

    // Remove from cache
    const turns = this.turnCache.get(deletedTurn.gameId) || [];
    this.turnCache.set(
      deletedTurn.gameId,
      turns.filter((turn) => turn.id !== deletedTurn.id),
    );

    return deletedTurn;
  }

  // Retrieve all turns for a specific game
  async getTurnsForGame(
    gameId: string,
  ): Promise<ExecutiveGameTurnWithRelations[]> {
    // Check the cache
    if (this.turnCache.has(gameId)) {
      return this.turnCache.get(gameId) || [];
    }

    // Fallback to the database
    const turns = await this.prisma.executiveGameTurn.findMany({
      where: { gameId },
      orderBy: { turnNumber: 'asc' },
      include: {
        phases: true,
        tricks: {
          include: {
            trickCards: {
              include: {
                card: true,
                player: true,
              },
            },
          },
        },
        influenceBids: true,
        influenceVotes: true,
        playerPasses: true, // Ensure playerPasses is included
      },
    });

    // Update the cache
    this.turnCache.set(gameId, turns);

    return turns;
  }

  // Utility: Add a turn to the cache
  private addToCache(
    gameId: string,
    turn: ExecutiveGameTurnWithRelations,
  ): void {
    const turns = this.turnCache.get(gameId) || [];
    this.turnCache.set(gameId, [...turns, turn]);
  }

  // Utility: Apply filters, sorting, and pagination to cached data
  private applyFiltersAndPagination(
    turns: ExecutiveGameTurnWithRelations[],
    where?: Prisma.ExecutiveGameTurnWhereInput,
    orderBy?: Prisma.ExecutiveGameTurnOrderByWithRelationInput,
    skip?: number,
    take?: number,
  ): ExecutiveGameTurnWithRelations[] {
    let filteredTurns = turns;

    // Apply where filters
    if (where) {
      filteredTurns = filteredTurns.filter((turn) =>
        Object.entries(where).every(([key, value]) => {
          return turn[key as keyof ExecutiveGameTurnWithRelations] === value;
        }),
      );
    }

    // Apply sorting
    if (orderBy) {
      const [key, order] = Object.entries(orderBy)[0];
      filteredTurns.sort((a, b) =>
        order === 'asc'
          ? a[key as keyof ExecutiveGameTurnWithRelations] >
            b[key as keyof ExecutiveGameTurnWithRelations]
            ? 1
            : -1
          : a[key as keyof ExecutiveGameTurnWithRelations] <
              b[key as keyof ExecutiveGameTurnWithRelations]
            ? 1
            : -1,
      );
    }

    // Apply pagination
    return filteredTurns.slice(
      skip || 0,
      (skip || 0) + (take || filteredTurns.length),
    );
  }

  async getLatestTurn(
    gameId: string,
  ): Promise<ExecutiveGameTurnWithRelations | null> {
    // Start measuring
    const startTime = performance.now();

    const latestTurn = await this.prisma.executiveGameTurn.findFirst({
      where: { gameId },
      orderBy: { turnNumber: 'desc' },
      include: {
        phases: true,
        tricks: {
          include: {
            trickCards: {
              include: {
                card: true,
                player: true,
              },
            },
          },
        },
        influenceBids: true,
        influenceVotes: true,
        playerPasses: true,
      },
    });

    // Stop measuring
    const endTime = performance.now();

    // Log the duration
    console.log(`[getLatestTurn] Time taken ${endTime - startTime} ms`);

    return latestTurn;
  }

  async getLatestTurnId(gameId: string): Promise<string | null> {
    // Start measuring
    const startTime = performance.now();
    const latestTurn = await this.prisma.executiveGameTurn.findFirst({
      where: { gameId },
      orderBy: { turnNumber: 'desc' },
      select: { id: true },
    });
    // Stop measuring
    const endTime = performance.now();
    console.log(`[getLatestTurnId] Time taken: ${endTime - startTime} ms`);
    return latestTurn?.id || null;
  }
}
