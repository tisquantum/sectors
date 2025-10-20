import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, FactoryProduction } from '@prisma/client';

@Injectable()
export class FactoryProductionService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async factoryProduction(
    factoryProductionWhereUniqueInput: Prisma.FactoryProductionWhereUniqueInput,
  ): Promise<FactoryProduction | null> {
    return this.prisma.factoryProduction.findUnique({
      where: factoryProductionWhereUniqueInput,
    });
  }

  async factoryProductions(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.FactoryProductionWhereUniqueInput;
    where?: Prisma.FactoryProductionWhereInput;
    orderBy?: Prisma.FactoryProductionOrderByWithRelationInput;
  }): Promise<FactoryProduction[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.factoryProduction.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async factoryProductionsWithRelations(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.FactoryProductionWhereUniqueInput;
    where?: Prisma.FactoryProductionWhereInput;
    orderBy?: Prisma.FactoryProductionOrderByWithRelationInput;
  }): Promise<FactoryProduction[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.factoryProduction.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        Factory: true,
        Company: true,
        Game: true,
        GameTurn: true,
      },
    });
  }

  async factoryProductionsByGameTurn(gameTurnId: string): Promise<FactoryProduction[]> {
    return this.prisma.factoryProduction.findMany({
      where: { gameTurnId },
      include: {
        Factory: true,
        Company: true,
      },
    });
  }

  async factoryProductionsByFactory(factoryId: string): Promise<FactoryProduction[]> {
    return this.prisma.factoryProduction.findMany({
      where: { factoryId },
      orderBy: { createdAt: 'desc' },
      include: {
        GameTurn: true,
      },
    });
  }

  async factoryProductionsByCompany(companyId: string, gameId: string): Promise<FactoryProduction[]> {
    return this.prisma.factoryProduction.findMany({
      where: { companyId, gameId },
      orderBy: { createdAt: 'desc' },
      include: {
        Factory: true,
        GameTurn: true,
      },
    });
  }

  async createFactoryProduction(
    data: Prisma.FactoryProductionCreateInput,
  ): Promise<FactoryProduction> {
    return this.prisma.factoryProduction.create({
      data,
    });
  }

  async createManyFactoryProductions(
    data: Prisma.FactoryProductionCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.factoryProduction.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async updateFactoryProduction(params: {
    where: Prisma.FactoryProductionWhereUniqueInput;
    data: Prisma.FactoryProductionUpdateInput;
  }): Promise<FactoryProduction> {
    const { where, data } = params;
    return this.prisma.factoryProduction.update({
      where,
      data,
    });
  }

  async deleteFactoryProduction(
    where: Prisma.FactoryProductionWhereUniqueInput,
  ): Promise<FactoryProduction> {
    return this.prisma.factoryProduction.delete({
      where,
    });
  }

  async deleteManyFactoryProductions(
    where: Prisma.FactoryProductionWhereInput,
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.factoryProduction.deleteMany({
      where,
    });
  }

  async countFactoryProductions(
    where?: Prisma.FactoryProductionWhereInput,
  ): Promise<number> {
    return this.prisma.factoryProduction.count({
      where,
    });
  }

  /**
   * Get total revenue for a company in a specific game turn
   */
  async getCompanyTurnRevenue(companyId: string, gameTurnId: string): Promise<number> {
    const productions = await this.prisma.factoryProduction.findMany({
      where: { companyId, gameTurnId },
    });

    return productions.reduce((sum, prod) => sum + prod.revenue, 0);
  }

  /**
   * Get total profit for a company in a specific game turn
   */
  async getCompanyTurnProfit(companyId: string, gameTurnId: string): Promise<number> {
    const productions = await this.prisma.factoryProduction.findMany({
      where: { companyId, gameTurnId },
    });

    return productions.reduce((sum, prod) => sum + prod.profit, 0);
  }

  /**
   * Get factory performance history
   */
  async getFactoryPerformanceHistory(factoryId: string): Promise<FactoryProduction[]> {
    return this.prisma.factoryProduction.findMany({
      where: { factoryId },
      orderBy: { createdAt: 'desc' },
      take: 10, // Last 10 turns
    });
  }
}

