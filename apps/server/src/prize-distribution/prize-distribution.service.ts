import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, PrizeDistribution } from '@prisma/client';

@Injectable()
export class PrizeDistributionService {
  constructor(private prisma: PrismaService) {}

  // Fetch a single prize distribution by its unique identifier
  async getPrizeDistribution(
    prizeDistributionWhereUniqueInput: Prisma.PrizeDistributionWhereUniqueInput,
  ): Promise<PrizeDistribution | null> {
    return this.prisma.prizeDistribution.findUnique({
      where: prizeDistributionWhereUniqueInput,
      include: {
        Prize: true,
        Player: true,
        Company: true,
        GameTurn: true,
      },
    });
  }

  // List prize distributions with optional filters, pagination, and sorting
  async listPrizeDistributions(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PrizeDistributionWhereUniqueInput;
    where?: Prisma.PrizeDistributionWhereInput;
    orderBy?: Prisma.PrizeDistributionOrderByWithRelationInput;
  }): Promise<PrizeDistribution[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.prizeDistribution.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        Prize: true,
        Player: true,
        Company: true,
        GameTurn: true,
      },
    });
  }

  // Create a new prize distribution
  async createPrizeDistribution(
    data: Prisma.PrizeDistributionCreateInput,
  ): Promise<PrizeDistribution> {
    return this.prisma.prizeDistribution.create({
      data,
    });
  }

  // Update a prize distribution by its unique identifier
  async updatePrizeDistribution(params: {
    where: Prisma.PrizeDistributionWhereUniqueInput;
    data: Prisma.PrizeDistributionUpdateInput;
  }): Promise<PrizeDistribution> {
    const { where, data } = params;
    return this.prisma.prizeDistribution.update({
      data,
      where,
    });
  }

  // Delete a prize distribution by its unique identifier
  async deletePrizeDistribution(
    where: Prisma.PrizeDistributionWhereUniqueInput,
  ): Promise<PrizeDistribution> {
    return this.prisma.prizeDistribution.delete({
      where,
    });
  }
}
