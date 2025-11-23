import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, OperatingRoundVote } from '@prisma/client';
import { CompanyTierData } from '@server/data/constants';

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
    //get company
    const company = await this.prisma.company.findUnique({
      where: {
        id: newData.Company.connect?.id || '',
      },
    });
    if (!company) {
      throw new Error('Company not found');
    }
    //get company tier
    const companyTier = CompanyTierData[company.companyTier as keyof typeof CompanyTierData];
    //ensure vote has not already been cast by player
    const existingVotes = await this.prisma.operatingRoundVote.findMany({
      where: {
        playerId: newData.Player.connect?.id || '',
        companyId: newData.Company.connect?.id || '',
        operatingRoundId: newData.OperatingRound.connect?.id ||'',
      },
    });
    if (existingVotes && existingVotes.length >= companyTier.companyActions) {
      throw new Error('Player has already voted for as many actions as allowed');
    }
    //if player has already voted for this action, throw error
    if(existingVotes.some(vote => vote.actionVoted === newData.actionVoted)){
      throw new Error('Player has already voted for this action');
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
