import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, InfluenceRound } from '@prisma/client';
import { InfluenceRoundWithVotes } from '@server/prisma/prisma.types';

@Injectable()
export class InfluenceRoundService {
  constructor(private prisma: PrismaService) {}

  async getInfluenceRound(
    influenceRoundWhereUniqueInput: Prisma.InfluenceRoundWhereUniqueInput,
  ): Promise<InfluenceRoundWithVotes | null> {
    return this.prisma.influenceRound.findUnique({
      where: influenceRoundWhereUniqueInput,
      include: {
        InfluenceVotes: {
          include: {
            Player: true,
          },
        },
      },
    });
  }

  async listInfluenceRounds(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.InfluenceRoundWhereUniqueInput;
    where?: Prisma.InfluenceRoundWhereInput;
    orderBy?: Prisma.InfluenceRoundOrderByWithRelationInput;
  }): Promise<InfluenceRound[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.influenceRound.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createInfluenceRound(
    data: Prisma.InfluenceRoundCreateInput,
  ): Promise<InfluenceRound> {
    return this.prisma.influenceRound.create({
      data,
    });
  }

  async createManyInfluenceRounds(
    data: Prisma.InfluenceRoundCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.influenceRound.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async updateInfluenceRound(params: {
    where: Prisma.InfluenceRoundWhereUniqueInput;
    data: Prisma.InfluenceRoundUpdateInput;
  }): Promise<InfluenceRound> {
    const { where, data } = params;
    return this.prisma.influenceRound.update({
      data,
      where,
    });
  }

  async deleteInfluenceRound(
    where: Prisma.InfluenceRoundWhereUniqueInput,
  ): Promise<InfluenceRound> {
    return this.prisma.influenceRound.delete({
      where,
    });
  }
}
