import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, ExecutivePlayer } from '@prisma/client';
import {
  ExecutivePlayerWithAgendas,
  ExecutivePlayerWithCards,
  ExecutivePlayerWithRelations,
} from '@server/prisma/prisma.types';

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

  async getExecutivePlayerAndAgendas(
    executivePlayerWhereUniqueInput: Prisma.ExecutivePlayerWhereUniqueInput,
  ): Promise<ExecutivePlayerWithAgendas | null> {
    return this.prisma.executivePlayer.findUnique({
      where: executivePlayerWhereUniqueInput,
      include: {
        agendas: true,
      },
    });
  }

  async getExecutivePlayerWithCards(
    executivePlayerWhereUniqueInput: Prisma.ExecutivePlayerWhereUniqueInput,
  ): Promise<ExecutivePlayerWithCards | null> {
    return this.prisma.executivePlayer.findUnique({
      where: executivePlayerWhereUniqueInput,
      include: {
        cards: true,
      },
    });
  }
  async getExecutivePlayerByUserIdAndGameId(
    userId: string,
    gameId: string,
  ): Promise<ExecutivePlayerWithRelations | null> {
    return this.prisma.executivePlayer.findFirst({
      where: {
        userId,
        gameId,
      },
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

  async findExecutivePlayer(
    where: Prisma.ExecutivePlayerWhereInput,
  ): Promise<ExecutivePlayer | null> {
    return this.prisma.executivePlayer.findFirst({
      where,
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
  }): Promise<ExecutivePlayerWithRelations[]> {
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
        user: true,
        selfInfluence: true,
        ownedByInfluence: true,
        agendas: true,
        executiveTricks: true,
      },
    });
  }

  async listExecutivePlayersNoRelations(params: {
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

  async updateManyExecutivePlayers(params: {
    where: Prisma.ExecutivePlayerWhereInput;
    data: Prisma.ExecutivePlayerUpdateManyMutationInput;
  }): Promise<Prisma.BatchPayload> {
    const { where, data } = params;
    return this.prisma.executivePlayer.updateMany({
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
