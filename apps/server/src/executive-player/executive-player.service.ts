import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, ExecutivePlayer } from '@prisma/client';
import { ExecutivePlayerWithRelations } from '@server/prisma/prisma.types';

@Injectable()
export class ExecutivePlayerService {
  constructor(private prisma: PrismaService) {}

  // Retrieve a specific ExecutivePlayer by unique input
  async getExecutivePlayer(
    executivePlayerWhereUniqueInput: Prisma.ExecutivePlayerWhereUniqueInput,
  ): Promise<ExecutivePlayerWithRelations | null> {
    return this.prisma.executivePlayer.findUnique({
      where: executivePlayerWhereUniqueInput,
      include: {
        user: true,
        victoryPoints: true,
        cards: true,
        selfInfluence: true,
        ownedByInfluence: true,
        agendas: true,
        executiveTricks: true,
      },
    });
  }

  // List all ExecutivePlayers with optional filtering, pagination, and sorting
  async listExecutivePlayers(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ExecutivePlayerWhereUniqueInput;
    where?: Prisma.ExecutivePlayerWhereInput;
    orderBy?: Prisma.ExecutivePlayerOrderByWithRelationInput;
  }): Promise<ExecutivePlayer[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.executivePlayer.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        victoryPoints: true,
        cards: true,
        game: true,
        user: true,
        selfInfluence: true,
        ownedByInfluence: true,
        agendas: true,
      },
    });
  }

  // Create a new ExecutivePlayer
  async createExecutivePlayer(
    data: Prisma.ExecutivePlayerCreateInput,
  ): Promise<ExecutivePlayer> {
    return this.prisma.executivePlayer.create({
      data,
    });
  }

  // Create multiple ExecutivePlayers
  async createManyExecutivePlayers(
    data: Prisma.ExecutivePlayerCreateManyInput[],
  ): Promise<ExecutivePlayer[]> {
    return this.prisma.executivePlayer.createManyAndReturn({
      data,
      skipDuplicates: true,
    });
  }

  // Update an existing ExecutivePlayer
  async updateExecutivePlayer(params: {
    where: Prisma.ExecutivePlayerWhereUniqueInput;
    data: Prisma.ExecutivePlayerUpdateInput;
  }): Promise<ExecutivePlayer> {
    const { where, data } = params;
    return this.prisma.executivePlayer.update({
      data,
      where,
    });
  }

  // Delete an ExecutivePlayer
  async deleteExecutivePlayer(
    where: Prisma.ExecutivePlayerWhereUniqueInput,
  ): Promise<ExecutivePlayer> {
    return this.prisma.executivePlayer.delete({
      where,
    });
  }
}
