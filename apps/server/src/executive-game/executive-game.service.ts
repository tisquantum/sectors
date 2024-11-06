import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, ExecutiveGame } from '@prisma/client';

@Injectable()
export class ExecutiveGameService {
  constructor(private prisma: PrismaService) {}

  // Retrieve a specific ExecutiveGame by unique input
  async getExecutiveGame(
    executiveGameWhereUniqueInput: Prisma.ExecutiveGameWhereUniqueInput,
  ): Promise<ExecutiveGame | null> {
    return this.prisma.executiveGame.findUnique({
      where: executiveGameWhereUniqueInput,
      include: {
        players: true,
        executiveCards: true,
        influence: true,
        ExecutiveVictoryPoint: true,
        ExecutiveAgenda: true,
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
}
