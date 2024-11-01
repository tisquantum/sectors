import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, StockSubRound } from '@prisma/client';

@Injectable()
export class StockSubRoundService {
  constructor(private prisma: PrismaService) {}

  async stockSubRound(
    stockSubRoundWhereUniqueInput: Prisma.StockSubRoundWhereUniqueInput,
  ): Promise<StockSubRound | null> {
    return this.prisma.stockSubRound.findUnique({
      where: stockSubRoundWhereUniqueInput,
    });
  }

  async stockSubRounds(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.StockSubRoundWhereUniqueInput;
    where?: Prisma.StockSubRoundWhereInput;
    orderBy?: Prisma.StockSubRoundOrderByWithRelationInput;
  }): Promise<StockSubRound[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.stockSubRound.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async stockSubRoundWithDetails(
    stockSubRoundWhereUniqueInput: Prisma.StockSubRoundWhereUniqueInput,
  ): Promise<StockSubRound | null> {
    return this.prisma.stockSubRound.findUnique({
      where: stockSubRoundWhereUniqueInput,
      include: {
        playerOrders: {
          include: {
            Player: true,
            Company: {
              include: {
                Share: true,
                CompanyActions: true,
              },
            },
            Sector: true,
            Phase: true,
            GameTurn: true,
          },
        },
        GameTurn: true,
        StockRound: true,
        Game: true,
        Phase: true,
      },
    });
  }

  async createStockSubRound(
    data: Prisma.StockSubRoundCreateInput,
  ): Promise<StockSubRound> {
    return this.prisma.stockSubRound.create({
      data,
    });
  }

  async createManyStockSubRounds(
    data: Prisma.StockSubRoundCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.stockSubRound.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async updateStockSubRound(params: {
    where: Prisma.StockSubRoundWhereUniqueInput;
    data: Prisma.StockSubRoundUpdateInput;
  }): Promise<StockSubRound> {
    const { where, data } = params;
    return this.prisma.stockSubRound.update({
      data,
      where,
    });
  }

  async deleteStockSubRound(
    where: Prisma.StockSubRoundWhereUniqueInput,
  ): Promise<StockSubRound> {
    return this.prisma.stockSubRound.delete({
      where,
    });
  }

  async hasOrders(id: string): Promise<boolean> {
    const orders = await this.prisma.playerOrder.findMany({
      where: {
        stockSubRoundId: id,
      },
    });
    return orders.length > 0;
  }
}
