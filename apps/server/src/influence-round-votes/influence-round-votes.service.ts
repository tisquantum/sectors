import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, InfluenceVote } from '@prisma/client';
import { InfluenceVoteWithPlayer } from '@server/prisma/prisma.types';

@Injectable()
export class InfluenceRoundVotesService {
  constructor(private prisma: PrismaService) {}

  async getInfluenceVote(
    influenceVoteWhereUniqueInput: Prisma.InfluenceVoteWhereUniqueInput,
  ): Promise<InfluenceVote | null> {
    return this.prisma.influenceVote.findUnique({
      where: influenceVoteWhereUniqueInput,
    });
  }

  async listInfluenceVotes(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.InfluenceVoteWhereUniqueInput;
    where?: Prisma.InfluenceVoteWhereInput;
    orderBy?: Prisma.InfluenceVoteOrderByWithRelationInput;
  }): Promise<InfluenceVoteWithPlayer[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.influenceVote.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        Player: true,
      },
    });
  }

  async createInfluenceVote(
    data: Prisma.InfluenceVoteCreateInput,
  ): Promise<InfluenceVote> {
    return this.prisma.influenceVote.create({
      data,
    });
  }

  async createManyInfluenceVotes(
    data: Prisma.InfluenceVoteCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.influenceVote.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async updateInfluenceVote(params: {
    where: Prisma.InfluenceVoteWhereUniqueInput;
    data: Prisma.InfluenceVoteUpdateInput;
  }): Promise<InfluenceVote> {
    const { where, data } = params;
    return this.prisma.influenceVote.update({
      data,
      where,
    });
  }

  async deleteInfluenceVote(
    where: Prisma.InfluenceVoteWhereUniqueInput,
  ): Promise<InfluenceVote> {
    return this.prisma.influenceVote.delete({
      where,
    });
  }
}
