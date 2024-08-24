import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, Prize } from '@prisma/client';
import {
  PrizeWithRelations,
  PrizeWithSectorPrizes,
} from '@server/prisma/prisma.types';

@Injectable()
export class PrizeService {
  constructor(private prisma: PrismaService) {}

  // Fetch a single prize by its unique identifier
  async getPrize(
    prizeWhereUniqueInput: Prisma.PrizeWhereUniqueInput,
  ): Promise<PrizeWithRelations | null> {
    return this.prisma.prize.findUnique({
      where: prizeWhereUniqueInput,
      include: {
        SectorPrizes: {
          include: {
            Sector: true,
          },
        },
        PrizeDistributions: {
          include: {
            Player: true,
            Company: true,
            GameTurn: true,
          },
        },
      },
    });
  }

  // List prizes with optional filters, pagination, and sorting
  async listPrizes(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PrizeWhereUniqueInput;
    where?: Prisma.PrizeWhereInput;
    orderBy?: Prisma.PrizeOrderByWithRelationInput;
  }): Promise<PrizeWithRelations[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.prize.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        PrizeDistributions: {
          include: {
            Player: true,
            Company: true,
            GameTurn: true,
          },
        },
        SectorPrizes: {
          include: {
            Sector: true,
          },
        },
      },
    });
  }

  // Create a new prize along with its associated sector prizes
  async createPrize(data: Prisma.PrizeCreateInput): Promise<Prize> {
    return this.prisma.prize.create({
      data: {
        ...data,
      },
    });
  }

  // Create multiple prizes at once
  async createManyPrizes(
    data: Prisma.PrizeCreateManyInput[],
  ): Promise<Prize[]> {
    return this.prisma.prize.createManyAndReturn({
      data,
      skipDuplicates: true,
    });
  }

  // Update a prize with optional changes to associated sector prizes
  async updatePrize(params: {
    where: Prisma.PrizeWhereUniqueInput;
    data: Prisma.PrizeUpdateInput;
  }): Promise<Prize> {
    const { where, data } = params;
    return this.prisma.prize.update({
      data: {
        ...data,
      },
      where,
    });
  }

  // Delete a prize by its unique identifier
  async deletePrize(where: Prisma.PrizeWhereUniqueInput): Promise<Prize> {
    return this.prisma.prize.delete({
      where,
    });
  }
}
