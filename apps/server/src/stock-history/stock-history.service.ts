import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, StockAction, StockHistory } from '@prisma/client';
import {
  getStockPriceStepsUp,
  getStockPriceWithStepsDown,
} from '@server/data/constants';
import { Action } from 'rxjs/internal/scheduler/Action';

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
    const updatedCompany = await this.prisma.company.update({
      where: { id: companyId },
      data: {
        currentStockPrice: newPrice,
      },
    });
    await this.prisma.gameLog.create({
      data: {
        gameId: gameId,
        content: `Stock price for ${updatedCompany.name} moved up by ${steps} steps`,
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
    //get new stock price
    const newPrice = getStockPriceWithStepsDown(currentStockPrice, steps);
    //update company stock price
    const updatedCompany = await this.prisma.company.update({
      where: { id: companyId },
      data: {
        currentStockPrice: newPrice,
      },
    });
    await this.prisma.gameLog.create({
      data: {
        gameId: gameId,
        content: `Stock price for ${updatedCompany.name} moved down by ${steps} steps`,
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
