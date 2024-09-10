import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, PlayerHeadline } from '@prisma/client';

@Injectable()
export class PlayerHeadlineService {
  constructor(private prisma: PrismaService) {}

  // Retrieve a specific PlayerHeadline by unique input
  async getPlayerHeadline(
    playerHeadlineWhereUniqueInput: Prisma.PlayerHeadlineWhereUniqueInput,
  ): Promise<PlayerHeadline | null> {
    return this.prisma.playerHeadline.findUnique({
      where: playerHeadlineWhereUniqueInput,
      include: {
        game: true,
        player: true,
        headline: true,
      },
    });
  }

  // List all PlayerHeadlines with optional filtering, pagination, and sorting
  async listPlayerHeadlines(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PlayerHeadlineWhereUniqueInput;
    where?: Prisma.PlayerHeadlineWhereInput;
    orderBy?: Prisma.PlayerHeadlineOrderByWithRelationInput;
  }): Promise<PlayerHeadline[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.playerHeadline.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  // Create a new PlayerHeadline
  async createPlayerHeadline(
    data: Prisma.PlayerHeadlineCreateInput,
  ): Promise<PlayerHeadline> {
    return this.prisma.playerHeadline.create({
      data,
    });
  }

  // Create multiple PlayerHeadlines
  async createManyPlayerHeadlines(
    data: Prisma.PlayerHeadlineCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.playerHeadline.createMany({
      data,
      skipDuplicates: true,
    });
  }

  // Update an existing PlayerHeadline
  async updatePlayerHeadline(params: {
    where: Prisma.PlayerHeadlineWhereUniqueInput;
    data: Prisma.PlayerHeadlineUpdateInput;
  }): Promise<PlayerHeadline> {
    const { where, data } = params;
    return this.prisma.playerHeadline.update({
      data,
      where,
    });
  }

  // Delete a PlayerHeadline
  async deletePlayerHeadline(
    where: Prisma.PlayerHeadlineWhereUniqueInput,
  ): Promise<PlayerHeadline> {
    return this.prisma.playerHeadline.delete({
      where,
    });
  }
}
