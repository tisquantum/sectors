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

  async createOperatingRoundVote(
    data: Prisma.OperatingRoundVoteCreateInput,
  ): Promise<OperatingRoundVote> {
    const newData = { ...data };
    //ensure vote has not already been cast by player
    const existingVote = await this.prisma.operatingRoundVote.findFirst({
      where: {
        playerId: newData.Player.connect?.id || '',
        companyId: newData.Company.connect?.id || '',
        operatingRoundId: newData.OperatingRound.connect?.id || 0,
      },
    });
    if (existingVote) {
      throw new Error('Player has already voted');
    }
    // Calculate vote weight
    const sharesOwned = await this.prisma.share.findMany({
      where: {
        playerId: newData.Player.connect?.id,
        companyId: newData.Company.connect?.id,
      },
    });

    newData.weight = sharesOwned.length;

    return this.prisma.operatingRoundVote.create({
      data: newData,
    });
  }

  async createManyOperatingRoundVotes(
    data: Prisma.OperatingRoundVoteCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    const processedData = await Promise.all(
      data.map(async (d) => {
        const newData = { ...d };

        // Calculate vote weight
        const sharesOwned = await this.prisma.share.findMany({
          where: {
            playerId: newData.playerId,
            companyId: newData.companyId,
          },
        });

        newData.weight = sharesOwned.length;
        return newData;
      }),
    );

    return this.prisma.operatingRoundVote.createMany({
      data: processedData,
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

  async deleteOperatingRoundVote(
    where: Prisma.OperatingRoundVoteWhereUniqueInput,
  ): Promise<OperatingRoundVote> {
    return this.prisma.operatingRoundVote.delete({
      where,
    });
  }
}
