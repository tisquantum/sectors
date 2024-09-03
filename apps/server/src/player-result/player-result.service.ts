import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Adjust the path as necessary
import { Prisma, PlayerResult, Player } from '@prisma/client';
import { PlayerResultWithRelations } from '@server/prisma/prisma.types';

@Injectable()
export class PlayerResultService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a new player result
  async createPlayerResult(
    data: Prisma.PlayerResultCreateInput,
  ): Promise<PlayerResult> {
    return this.prisma.playerResult.create({
      data,
    });
  }

  async createManyPlayerResults(
    data: Prisma.PlayerResultCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.playerResult.createMany({
      data,
    });
  }

  // Get a player result by ID
  async getPlayerResultById(id: string): Promise<PlayerResult | null> {
    return this.prisma.playerResult.findUnique({
      where: { id },
    });
  }

  // Update a player result by ID
  async updatePlayerResult(
    id: string,
    data: Prisma.PlayerResultUpdateInput,
  ): Promise<PlayerResult> {
    return this.prisma.playerResult.update({
      where: { id },
      data,
    });
  }

  // Delete a player result by ID
  async deletePlayerResult(id: string): Promise<PlayerResult> {
    return this.prisma.playerResult.delete({
      where: { id },
    });
  }

  // Get all player results
  async getAllPlayerResults(): Promise<PlayerResult[]> {
    return this.prisma.playerResult.findMany();
  }

  async listPlayerResults(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PlayerResultWhereUniqueInput;
    where?: Prisma.PlayerResultWhereInput;
    orderBy?: Prisma.PlayerResultOrderByWithRelationInput;
  }): Promise<PlayerResultWithRelations[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.playerResult.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        player: {
          include: {
            Share: true,
          },
        },
      },
    });
  }

  async groupPlayerResultsByUserIdAndSumRankingPoints(params: {
    where?: Prisma.PlayerResultWhereInput;
    orderBy?: Prisma.PlayerResultSumOrderByAggregateInput;
  }) {
    const { where, orderBy } = params;
    return this.prisma.playerResult.groupBy({
      by: ['userId'],
      _sum: {
        rankingPoints: true,
      },
      where,
      orderBy: {
        _sum: {
          rankingPoints: orderBy?.rankingPoints,
        },
      },
      take: 100,
    });
  }
}
