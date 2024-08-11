import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, StockRound } from '@prisma/client';
import { StockRoundWithPlayerOrders } from '@server/prisma/prisma.types';

@Injectable()
export class StockRoundService {
  constructor(private prisma: PrismaService) {}

  async stockRound(
    stockRoundWhereUniqueInput: Prisma.StockRoundWhereUniqueInput,
  ): Promise<StockRound | null> {
    return this.prisma.stockRound.findUnique({
      where: stockRoundWhereUniqueInput,
    });
  }

  async stockRounds(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.StockRoundWhereUniqueInput;
    where?: Prisma.StockRoundWhereInput;
    orderBy?: Prisma.StockRoundOrderByWithRelationInput;
  }): Promise<StockRound[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.stockRound.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async stockRoundWithPlayerOrders(
    stockRoundWhereUniqueInput: Prisma.StockRoundWhereUniqueInput,
  ): Promise<StockRoundWithPlayerOrders | null> {
    return this.prisma.stockRound.findUnique({
      where: stockRoundWhereUniqueInput,
      include: {
        playerOrders: {
          include: {
            Player: true,
            Company: {
              include: {
                Share: true,
              },
            },
            Sector: true,
            Phase: true,
            GameTurn: true,
          },
        },
      },
    });
  }

  async createStockRound(
    data: Prisma.StockRoundCreateInput,
  ): Promise<StockRound> {
    return this.prisma.stockRound.create({
      data,
    });
  }

  async createManyStockRounds(
    data: Prisma.StockRoundCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.stockRound.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async updateStockRound(params: {
    where: Prisma.StockRoundWhereUniqueInput;
    data: Prisma.StockRoundUpdateInput;
  }): Promise<StockRound> {
    const { where, data } = params;
    return this.prisma.stockRound.update({
      data,
      where,
    });
  }

  async deleteStockRound(
    where: Prisma.StockRoundWhereUniqueInput,
  ): Promise<StockRound> {
    return this.prisma.stockRound.delete({
      where,
    });
  }
}
