import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, OperatingRoundVote } from '@prisma/client';

@Injectable()
export class OperatingRoundVoteService {
  constructor(private prisma: PrismaService) {}

  async operatingRoundVote(
    operatingRoundVoteWhereUniqueInput: Prisma.OperatingRoundVoteWhereUniqueInput,
  ): Promise<OperatingRoundVote | null> {
    return this.prisma.operatingRoundVote.findUnique({
      where: operatingRoundVoteWhereUniqueInput,
    });
  }

  async operatingRoundVotes(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.OperatingRoundVoteWhereUniqueInput;
    where?: Prisma.OperatingRoundVoteWhereInput;
    orderBy?: Prisma.OperatingRoundVoteOrderByWithRelationInput;
  }): Promise<OperatingRoundVote[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.operatingRoundVote.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createOperatingRoundVote(data: Prisma.OperatingRoundVoteCreateInput): Promise<OperatingRoundVote> {
    return this.prisma.operatingRoundVote.create({
      data,
    });
  }

  async createManyOperatingRoundVotes(data: Prisma.OperatingRoundVoteCreateManyInput[]): Promise<Prisma.BatchPayload> {
    return this.prisma.operatingRoundVote.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async updateOperatingRoundVote(params: {
    where: Prisma.OperatingRoundVoteWhereUniqueInput;
    data: Prisma.OperatingRoundVoteUpdateInput;
  }): Promise<OperatingRoundVote> {
    const { where, data } = params;
    return this.prisma.operatingRoundVote.update({
      data,
      where,
    });
  }

  async deleteOperatingRoundVote(where: Prisma.OperatingRoundVoteWhereUniqueInput): Promise<OperatingRoundVote> {
    return this.prisma.operatingRoundVote.delete({
      where,
    });
  }
}
