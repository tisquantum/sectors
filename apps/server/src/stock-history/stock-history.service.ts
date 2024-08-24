import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import {
  OperatingRoundAction,
  Prisma,
  StockAction,
  StockHistory,
} from '@prisma/client';
import {
  getStepsBetweenTwoNumbers,
  getStockPriceClosestEqualOrLess,
  getStockPriceStepsUp,
  getStockPriceWithStepsDown,
  stockTierChartRanges,
} from '@server/data/constants';
import { getTierMaxValue, getTierMinValue } from '@server/data/helpers';

@Injectable()
export class StockHistoryService {
  constructor(private prisma: PrismaService) {}

  async stockHistory(
    stockHistoryWhereUniqueInput: Prisma.StockHistoryWhereUniqueInput,
  ): Promise<StockHistory | null> {
    return this.prisma.stockHistory.findUnique({
      where: stockHistoryWhereUniqueInput,
    });
  }

  async stockHistories(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.StockHistoryWhereUniqueInput;
    where?: Prisma.StockHistoryWhereInput;
    orderBy?: Prisma.StockHistoryOrderByWithRelationInput;
  }): Promise<StockHistory[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.stockHistory.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createStockHistory(
    data: Prisma.StockHistoryCreateInput,
  ): Promise<StockHistory> {
    return this.prisma.stockHistory.create({
      data,
    });
  }

  async createManyStockHistories(
    data: Prisma.StockHistoryCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.stockHistory.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async updateStockHistory(params: {
    where: Prisma.StockHistoryWhereUniqueInput;
    data: Prisma.StockHistoryUpdateInput;
  }): Promise<StockHistory> {
    const { where, data } = params;
    return this.prisma.stockHistory.update({
      data,
      where,
    });
  }

  async deleteStockHistory(
    where: Prisma.StockHistoryWhereUniqueInput,
  ): Promise<StockHistory> {
    return this.prisma.stockHistory.delete({
      where,
    });
  }

  async moveStockPriceUp(
    gameId: string,
    companyId: string,
    phaseId: string,
    currentStockPrice: number,
    steps: number,
    action: StockAction,
  ): Promise<StockHistory> {
    //get new stock price
    const newPrice = getStockPriceStepsUp(currentStockPrice, steps);
    //update company stock price
    await this.prisma.company.update({
      where: { id: companyId },
      data: {
        currentStockPrice: newPrice,
      },
    });
    //create new stock history
    return this.createStockHistory({
      price: newPrice,
      stepsMoved: steps,
      action: action,
      Phase: {
        connect: {
          id: phaseId,
        },
      },
      Company: {
        connect: {
          id: companyId,
        },
      },
      Game: {
        connect: {
          id: gameId,
        },
      },
    });
  }

  async moveStockPriceDown(
    gameId: string,
    companyId: string,
    phaseId: string,
    currentStockPrice: number,
    steps: number,
    action: StockAction,
  ): Promise<StockHistory> {
    //get company actions for companyId
    const hasRegulatoryShield = await this.prisma.companyAction.findFirst({
      where: {
        companyId: companyId,
        action: OperatingRoundAction.REGULATORY_SHIELD,
      },
    });
    let newPrice = getStockPriceWithStepsDown(currentStockPrice, steps);
    //if company has regulatory shield, prevent company from falling below the top-most spot of the stock tier underneath it
    if (hasRegulatoryShield) {
      //get stock tier for current stock price
      const currentTier = stockTierChartRanges.find(
        (tier) =>
          currentStockPrice >= tier.chartMinValue &&
          currentStockPrice <= tier.chartMaxValue,
      );
      //get tier below current tier
      const tierBelow = stockTierChartRanges.find(
        (tier) => tier.chartMaxValue === (currentTier?.chartMinValue || 0) - 1,
      );
      //check if new price is below tier below tier below max value
      if (tierBelow && newPrice < getTierMaxValue(tierBelow.tier)) {
        newPrice = getStockPriceClosestEqualOrLess(tierBelow.chartMaxValue);
        steps = getStepsBetweenTwoNumbers(currentStockPrice, newPrice);
      }
    }
    //update company stock price
    await this.prisma.company.update({
      where: { id: companyId },
      data: {
        currentStockPrice: newPrice,
      },
    });
    //create new stock history
    return this.createStockHistory({
      price: newPrice,
      stepsMoved: steps,
      action: action,
      Phase: {
        connect: {
          id: phaseId,
        },
      },
      Company: {
        connect: {
          id: companyId,
        },
      },
      Game: {
        connect: {
          id: gameId,
        },
      },
    });
  }
}
