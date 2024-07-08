import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, CompanyAction, OperatingRoundAction } from '@prisma/client';
import { CompanyActionWithCompany } from '@server/prisma/prisma.types';

type MarketingCountGroupedBySectorId = {
  sectorId: string;
  count: number;
};

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
    const marketingOrders = await this.prisma.companyAction.findMany({
      where: {
        operatingRoundId,
        action: OperatingRoundAction.MARKETING,
      },
      include: {
        Company: true,
      },
    });
    console.log('marketingOrders', marketingOrders);
    if(!marketingOrders.length) {
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
  ): Promise<CompanyAction> {
    return this.prisma.companyAction.create({
      data,
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
  }): Promise<CompanyAction> {
    const { where, data } = params;
    return this.prisma.companyAction.update({
      data,
      where,
    });
  }

  async deleteCompanyAction(
    where: Prisma.CompanyActionWhereUniqueInput,
  ): Promise<CompanyAction> {
    return this.prisma.companyAction.delete({
      where,
    });
  }
}
