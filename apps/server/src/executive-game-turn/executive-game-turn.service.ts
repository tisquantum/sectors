import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, ExecutiveGameTurn } from '@prisma/client';
import { ExecutiveGameTurnWithRelations } from '@server/prisma/prisma.types';

@Injectable()
export class ExecutiveGameTurnService {
  constructor(private prisma: PrismaService) {}

  // Retrieve a specific ExecutiveGameTurn by unique input
  async getExecutiveGameTurn(
    executiveGameTurnWhereUniqueInput: Prisma.ExecutiveGameTurnWhereUniqueInput,
  ): Promise<ExecutiveGameTurn | null> {
    return this.prisma.executiveGameTurn.findUnique({
      where: executiveGameTurnWhereUniqueInput,
      include: {
        phases: true,
        tricks: true,
        influenceBids: true,
        influenceVotes: true,
        playerPasses: true,
      },
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
        tricks: true,
        influenceBids: true,
        influenceVotes: true,
        playerPasses: true,
      },
    });
  }

  // Create a new ExecutiveGameTurn
  async createExecutiveGameTurn(
    data: Prisma.ExecutiveGameTurnCreateInput,
  ): Promise<ExecutiveGameTurn> {
    return this.prisma.executiveGameTurn.create({
      data,
    });
  }

  // Create multiple ExecutiveGameTurns
  async createManyExecutiveGameTurns(
    data: Prisma.ExecutiveGameTurnCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.executiveGameTurn.createMany({
      data,
      skipDuplicates: true,
    });
  }

  // Update an existing ExecutiveGameTurn
  async updateExecutiveGameTurn(params: {
    where: Prisma.ExecutiveGameTurnWhereUniqueInput;
    data: Prisma.ExecutiveGameTurnUpdateInput;
  }): Promise<ExecutiveGameTurn> {
    const { where, data } = params;
    return this.prisma.executiveGameTurn.update({
      where,
      data,
    });
  }

  // Delete an ExecutiveGameTurn
  async deleteExecutiveGameTurn(
    where: Prisma.ExecutiveGameTurnWhereUniqueInput,
  ): Promise<ExecutiveGameTurn> {
    return this.prisma.executiveGameTurn.delete({
      where,
    });
  }

  // Retrieve the latest game turn for a specific game
  async getLatestTurn(
    gameId: string,
  ): Promise<ExecutiveGameTurnWithRelations | null> {
    return this.prisma.executiveGameTurn.findFirst({
      where: { gameId },
      orderBy: { turnNumber: 'desc' },
      include: {
        game: true,
        phases: true,
        tricks: true,
        influenceBids: true,
        influenceVotes: true,
        playerPasses: true,
      },
    });
  }

  // Retrieve all turns for a specific game
  async getTurnsForGame(gameId: string): Promise<ExecutiveGameTurn[]> {
    return this.prisma.executiveGameTurn.findMany({
      where: { gameId },
      orderBy: { turnNumber: 'asc' },
      include: {
        game: true,
        phases: true,
        tricks: true,
        influenceBids: true,
        influenceVotes: true,
      },
    });
  }
}
