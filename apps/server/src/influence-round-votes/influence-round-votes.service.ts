import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, InfluenceVote } from '@prisma/client';
import { InfluenceVoteWithPlayer } from '@server/prisma/prisma.types';
import { DEFAULT_INFLUENCE } from '@server/data/constants';

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
    //ensure player has not already voted
    const existingVote = await this.prisma.influenceVote.findFirst({
      where: {
        playerId: data.Player?.connect?.id || '',
        influenceRoundId: data.InfluenceRound?.connect?.id || 0,
      },
    });
    if (existingVote) {
      throw new Error('Player has already voted');
    }
    //if vote is higher than maximum, reject
    if (data.influence > DEFAULT_INFLUENCE) {
      throw new Error(`Influence cannot be greater than ${DEFAULT_INFLUENCE}`);
    }
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
