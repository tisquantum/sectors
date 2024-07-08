import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, RevenueDistributionVote } from '@prisma/client';
import { RevenueDistributionVoteWithRelations } from '@server/prisma/prisma.types';

@Injectable()
export class RevenueDistributionVoteService {
  constructor(private prisma: PrismaService) {}

  async revenueDistributionVote(
    voteWhereUniqueInput: Prisma.RevenueDistributionVoteWhereUniqueInput,
  ): Promise<RevenueDistributionVote | null> {
    return this.prisma.revenueDistributionVote.findUnique({
      where: voteWhereUniqueInput,
    });
  }

  async revenueDistributionVotes(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.RevenueDistributionVoteWhereUniqueInput;
    where?: Prisma.RevenueDistributionVoteWhereInput;
    orderBy?: Prisma.RevenueDistributionVoteOrderByWithRelationInput;
  }): Promise<RevenueDistributionVote[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.revenueDistributionVote.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async revenueDistributionVotesWithRelations(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.RevenueDistributionVoteWhereUniqueInput;
    where?: Prisma.RevenueDistributionVoteWhereInput;
    orderBy?: Prisma.RevenueDistributionVoteOrderByWithRelationInput;
  }): Promise<RevenueDistributionVoteWithRelations[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.revenueDistributionVote.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        Player: true,
        Company: true,
      },
    });
  }

  async createRevenueDistributionVote(
    data: Prisma.RevenueDistributionVoteCreateInput,
  ): Promise<RevenueDistributionVote> {
    return this.prisma.revenueDistributionVote.create({
      data,
    });
  }

  async createManyRevenueDistributionVotes(
    data: Prisma.RevenueDistributionVoteCreateManyInput[],
  ): Promise<RevenueDistributionVote[]> {
    // Remove id
    data.forEach((d) => delete d.id);
    return this.prisma.revenueDistributionVote.createManyAndReturn({
      data,
      skipDuplicates: true,
    });
  }

  async updateRevenueDistributionVote(params: {
    where: Prisma.RevenueDistributionVoteWhereUniqueInput;
    data: Prisma.RevenueDistributionVoteUpdateInput;
  }): Promise<RevenueDistributionVote> {
    const { where, data } = params;
    return this.prisma.revenueDistributionVote.update({
      data,
      where,
    });
  }

  async deleteRevenueDistributionVote(
    where: Prisma.RevenueDistributionVoteWhereUniqueInput,
  ): Promise<RevenueDistributionVote> {
    return this.prisma.revenueDistributionVote.delete({
      where,
    });
  }
}
