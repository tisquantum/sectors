import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, OperatingRound } from '@prisma/client';
import {
  OperatingRoundWithProductionResults,
  OperatingRoundWithRevenueDistributionVotes,
} from '@server/prisma/prisma.types';

@Injectable()
export class OperatingRoundService {
  constructor(private prisma: PrismaService) {}

  async operatingRound(
    operatingRoundWhereUniqueInput: Prisma.OperatingRoundWhereUniqueInput,
  ): Promise<OperatingRound | null> {
    return this.prisma.operatingRound.findUnique({
      where: operatingRoundWhereUniqueInput,
    });
  }

  async operatingRounds(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.OperatingRoundWhereUniqueInput;
    where?: Prisma.OperatingRoundWhereInput;
    orderBy?: Prisma.OperatingRoundOrderByWithRelationInput;
  }): Promise<OperatingRound[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.operatingRound.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async operatingRoundWithProductionResults(
    operatingRoundWhereUniqueInput: Prisma.OperatingRoundWhereUniqueInput,
  ): Promise<OperatingRoundWithProductionResults | null> {
    return this.prisma.operatingRound.findUnique({
      where: operatingRoundWhereUniqueInput,
      include: {
        productionResults: {
          include: {
            Company: {
              include: {
                Sector: true,
              },
            },
          },
        },
      },
    });
  }

  async createOperatingRound(
    data: Prisma.OperatingRoundCreateInput,
  ): Promise<OperatingRound> {
    return this.prisma.operatingRound.create({
      data,
    });
  }

  async createManyOperatingRounds(
    data: Prisma.OperatingRoundCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.operatingRound.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async updateOperatingRound(params: {
    where: Prisma.OperatingRoundWhereUniqueInput;
    data: Prisma.OperatingRoundUpdateInput;
  }): Promise<OperatingRound> {
    const { where, data } = params;
    return this.prisma.operatingRound.update({
      data,
      where,
    });
  }

  async deleteOperatingRound(
    where: Prisma.OperatingRoundWhereUniqueInput,
  ): Promise<OperatingRound> {
    return this.prisma.operatingRound.delete({
      where,
    });
  }

  async operatingRoundWithRevenueDistributionVotes(
    operatingRoundWhereUniqueInput: Prisma.OperatingRoundWhereUniqueInput,
  ): Promise<OperatingRoundWithRevenueDistributionVotes | null> {
    return this.prisma.operatingRound.findUnique({
      where: operatingRoundWhereUniqueInput,
      include: {
        revenueDistributionVotes: {
          include: {
            Player: true,
          },
        },
      },
    });
  }
}
