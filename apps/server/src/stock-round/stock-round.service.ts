import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, StockRound, StockSubRound } from '@prisma/client';
import {
  StockRoundWithPlayerOrders,
  StockRoundWithStockSubRounds,
} from '@server/prisma/prisma.types';
import { StockSubRoundService } from '@server/stock-sub-round/stock-sub-round.service';

@Injectable()
export class StockRoundService {
  constructor(
    private prisma: PrismaService,
    private stockSubRoundService: StockSubRoundService,
  ) {}

  async doesStockRoundExist(
    stockRoundWhereUniqueInput: Prisma.StockRoundWhereUniqueInput,
  ): Promise<boolean> {
    return Boolean(
      await this.prisma.stockRound.findUnique({
        where: stockRoundWhereUniqueInput,
      }),
    );
  }
  
  async stockRound(
    stockRoundWhereUniqueInput: Prisma.StockRoundWhereUniqueInput,
  ): Promise<StockRoundWithStockSubRounds | null> {
    return this.prisma.stockRound.findUnique({
      where: stockRoundWhereUniqueInput,
      include: {
        stockSubRounds: true,
      },
    });
  }

  async stockRounds(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.StockRoundWhereUniqueInput;
    where?: Prisma.StockRoundWhereInput;
    orderBy?: Prisma.StockRoundOrderByWithRelationInput;
  }): Promise<StockRoundWithStockSubRounds[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.stockRound.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        stockSubRounds: true,
      },
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
                CompanyActions: true,
              },
            },
            Sector: true,
            Phase: true,
            GameTurn: true,
            StockSubRound: true,
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

  async getCurrentSubStockRound(
    stockRoundId: string,
  ): Promise<StockSubRound | undefined> {
    //get stock round
    const stockRound = await this.stockRound({
      id: stockRoundId,
    });
    //get current sub stock round by checking for largest roundNumber
    return stockRound?.stockSubRounds.find(
      (subStockRound) =>
        subStockRound.roundNumber ===
        Math.max(
          ...stockRound.stockSubRounds.map((subRound) => subRound.roundNumber),
        ),
    );
  }
}
