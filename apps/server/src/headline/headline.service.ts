import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, Headline } from '@prisma/client';
import { HeadlineWithRelations } from '@server/prisma/prisma.types';

@Injectable()
export class HeadlineService {
  constructor(private prisma: PrismaService) {}

  // Retrieve a specific Headline by unique input
  async getHeadline(
    headlineWhereUniqueInput: Prisma.HeadlineWhereUniqueInput,
  ): Promise<Headline | null> {
    return this.prisma.headline.findUnique({
      where: headlineWhereUniqueInput,
      include: {
        game: true,
      },
    });
  }

  // List all Headlines with optional filtering, pagination, and sorting
  async listHeadlines(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.HeadlineWhereUniqueInput;
    where?: Prisma.HeadlineWhereInput;
    orderBy?: Prisma.HeadlineOrderByWithRelationInput;
  }): Promise<HeadlineWithRelations[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.headline.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        sector: true,
        company: true,
        playerHeadlines: {
          include: {
            player: true,
          },
        },
      },
    });
  }

  // Create a new Headline
  async createHeadline(data: Prisma.HeadlineCreateInput): Promise<Headline> {
    return this.prisma.headline.create({
      data,
    });
  }

  // Create multiple Headlines
  async createManyHeadlines(
    data: Prisma.HeadlineCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.headline.createMany({
      data,
      skipDuplicates: true,
    });
  }

  // Update an existing Headline
  async updateHeadline(params: {
    where: Prisma.HeadlineWhereUniqueInput;
    data: Prisma.HeadlineUpdateInput;
  }): Promise<Headline> {
    const { where, data } = params;
    return this.prisma.headline.update({
      data,
      where,
    });
  }

  // Delete a Headline
  async deleteHeadline(
    where: Prisma.HeadlineWhereUniqueInput,
  ): Promise<Headline> {
    return this.prisma.headline.delete({
      where,
    });
  }
}
