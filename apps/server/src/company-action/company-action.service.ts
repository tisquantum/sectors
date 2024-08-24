import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, CompanyAction, OperatingRoundAction } from '@prisma/client';
import { CompanyActionWithCompany } from '@server/prisma/prisma.types';

type MarketingCountGroupedBySectorId = {
  sectorId: string;
  count: number;
};

export interface CompanyActionUpdate {
  id: number;
  resolved?: boolean;
  companyId?: string;
  action?: OperatingRoundAction;
  operatingRoundId?: number;
  gameTurnId?: string;
}

@Injectable()
export class CompanyActionService {
  constructor(private prisma: PrismaService) {}

  async companyAction(
    companyActionWhereUniqueInput: Prisma.CompanyActionWhereUniqueInput,
  ): Promise<CompanyAction | null> {
    return this.prisma.companyAction.findUnique({
      where: companyActionWhereUniqueInput,
    });
  }

  async companyActionFirst(params: {
    where?: Prisma.CompanyActionWhereInput;
    orderBy?: Prisma.CompanyActionOrderByWithRelationInput;
  }): Promise<CompanyActionWithCompany | null> {
    const { where, orderBy } = params;
    return this.prisma.companyAction.findFirst({
      where,
      orderBy,
      include: {
        Company: true,
      },
    });
  }

  async companyActions(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CompanyActionWhereUniqueInput;
    where?: Prisma.CompanyActionWhereInput;
    orderBy?: Prisma.CompanyActionOrderByWithRelationInput;
  }): Promise<CompanyAction[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.companyAction.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async marketingOrdersGroupedBySectorId(
    operatingRoundId: number,
  ): Promise<MarketingCountGroupedBySectorId[]> {
    //get all marketing orders
    let marketingOrders;
    try {
      marketingOrders = await this.prisma.companyAction.findMany({
        where: {
          operatingRoundId,
          action: OperatingRoundAction.MARKETING,
        },
        include: {
          Company: true,
        },
      });
    } catch (error) {
      console.error('error', error);
      throw new Error('Error getting marketing orders');
    }
    console.log('marketingOrders', marketingOrders);
    if (!marketingOrders.length) {
      return [];
    }
    //group by sectorId
    const marketingOrdersGroupedBySectorId = marketingOrders.reduce<
      Record<string, number>
    >((acc, order) => {
      const sectorId = order.Company.sectorId;
      if (!acc[sectorId]) {
        acc[sectorId] = 0;
      }
      acc[sectorId] += 1;
      return acc;
    }, {});
    console.log(
      'marketingOrdersGroupedBySectorId',
      marketingOrdersGroupedBySectorId,
    );
    //convert to array
    return Object.entries(marketingOrdersGroupedBySectorId).map(
      ([sectorId, count]) => ({
        sectorId,
        count,
      }),
    );
  }

  async createCompanyAction(
    data: Prisma.CompanyActionCreateInput,
  ): Promise<CompanyActionWithCompany> {
    return this.prisma.companyAction.create({
      data,
      include: {
        Company: true,
      },
    });
  }

  async createManyCompanyActions(
    data: Prisma.CompanyActionCreateManyInput[],
  ): Promise<CompanyAction[]> {
    // Remove id
    data.forEach((d) => delete d.id);
    return this.prisma.companyAction.createManyAndReturn({
      data,
      skipDuplicates: true,
    });
  }

  async updateCompanyAction(params: {
    where: Prisma.CompanyActionWhereUniqueInput;
    data: Prisma.CompanyActionUpdateInput;
  }): Promise<CompanyActionWithCompany> {
    const { where, data } = params;
    return this.prisma.companyAction.update({
      data,
      where,
      include: {
        Company: true,
      },
    });
  }

  async updateManyCompanyActions(
    updates: {
      id: number;
      companyId?: string;
      action?: OperatingRoundAction;
      operatingRoundId?: number;
      resolved?: boolean;
      gameTurnId?: string;
      actedOn?: boolean;
    }[],
  ) {
    // Convert the updates array into the format required by Prisma's updateMany operation
    const updatePromises = updates.map((update) => {
      const data: {
        companyId?: string;
        action?: OperatingRoundAction;
        operatingRoundId?: number;
        resolved?: boolean;
        gameTurnId?: string;
        actedOn?: boolean;
      } = {};
  
      if (update.companyId !== undefined) {
        data.companyId = update.companyId;
      }
      if (update.action !== undefined) {
        data.action = update.action;
      }
      if (update.operatingRoundId !== undefined) {
        data.operatingRoundId = update.operatingRoundId;
      }
      if (update.resolved !== undefined) {
        data.resolved = update.resolved;
      }
      if (update.gameTurnId !== undefined) {
        data.gameTurnId = update.gameTurnId;
      }
      if (update.actedOn !== undefined) {
        data.actedOn = update.actedOn;
      }
  
      return this.prisma.companyAction.update({
        where: { id: update.id },
        data,
      });
    });
  
    // Execute all update promises in parallel
    await Promise.all(updatePromises);
  }  

  async deleteCompanyAction(
    where: Prisma.CompanyActionWhereUniqueInput,
  ): Promise<CompanyAction> {
    return this.prisma.companyAction.delete({
      where,
    });
  }
}
