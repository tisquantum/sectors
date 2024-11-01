import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, Company, Sector, CompanyStatus } from '@prisma/client';
import {
  CompanyWithCards,
  CompanyWithCompanyActions,
  CompanyWithRelations,
  CompanyWithSector,
  CompanyWithSectorAndStockHistory,
  CompanyWithSectorOnly,
  CompanyWithShare,
  CompanyWithShareAndSector,
} from '@server/prisma/prisma.types';
import { GameLogService } from '@server/game-log/game-log.service';

@Injectable()
export class CompanyService {
  constructor(
    private prisma: PrismaService,
    private gamelogService: GameLogService,
  ) {}

  async company(
    companyWhereUniqueInput: Prisma.CompanyWhereUniqueInput,
  ): Promise<Company | null> {
    const company = this.prisma.company.findUnique({
      where: companyWhereUniqueInput,
    });
    return company;
  }

  async companyWithSectorFindFirst(params: {
    where?: Prisma.CompanyWhereInput;
    orderBy?: Prisma.CompanyOrderByWithRelationInput;
  }): Promise<CompanyWithSectorOnly | null> {
    return this.prisma.company.findFirst({
      ...params,
      include: {
        Sector: true,
      },
    });
  }

  async companyWithShares(
    companyWhereUniqueInput: Prisma.CompanyWhereUniqueInput,
  ): Promise<CompanyWithShare | null> {
    return this.prisma.company.findUnique({
      where: companyWhereUniqueInput,
      include: {
        Share: true,
      },
    });
  }

  async companyWithSharesAndSector(
    companyWhereUniqueInput: Prisma.CompanyWhereUniqueInput,
  ): Promise<CompanyWithShareAndSector | null> {
    return this.prisma.company.findUnique({
      where: companyWhereUniqueInput,
      include: {
        Share: true,
        Sector: true,
      },
    });
  }

  async companies(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CompanyWhereUniqueInput;
    where?: Prisma.CompanyWhereInput;
    orderBy?: Prisma.CompanyOrderByWithRelationInput;
  }): Promise<Company[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.company.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async companyWithSector(
    companyWhereUniqueInput: Prisma.CompanyWhereUniqueInput,
  ): Promise<CompanyWithSector | null> {
    return this.prisma.company.findUnique({
      where: companyWhereUniqueInput,
      include: {
        Sector: true,
        Share: {
          include: {
            Player: true,
          },
        },
      },
    });
  }

  async companyWithCards(
    companyWhereUniqueInput: Prisma.CompanyWhereUniqueInput,
  ): Promise<CompanyWithCards | null> {
    return this.prisma.company.findUnique({
      where: companyWhereUniqueInput,
      include: {
        Cards: true,
      },
    });
  }

  async companyWithRelations(
    companyWhereUniqueInput: Prisma.CompanyWhereUniqueInput,
  ): Promise<CompanyWithRelations | null> {
    return this.prisma.company.findUnique({
      where: companyWhereUniqueInput,
      include: {
        Sector: true,
        Share: {
          include: {
            Player: true,
          },
        },
        StockHistory: {
          include: {
            Phase: true,
          },
        },
        Cards: true,
        CompanyActions: true,
      },
    });
  }

  async companiesWithRelations(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CompanyWhereUniqueInput;
    where?: Prisma.CompanyWhereInput;
    orderBy?: Prisma.CompanyOrderByWithRelationInput;
  }): Promise<CompanyWithRelations[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.company.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        Sector: true,
        Share: {
          include: {
            Player: true,
          },
        },
        StockHistory: {
          include: {
            Phase: true,
          },
        },
        Cards: true,
        CompanyActions: true,
      },
    });
  }

  async companiesWithCompanyActions(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CompanyWhereUniqueInput;
    where?: Prisma.CompanyWhereInput;
    orderBy?: Prisma.CompanyOrderByWithRelationInput;
  }): Promise<CompanyWithCompanyActions[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.company.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        CompanyActions: true,
      },
    });
  }

  async companiesWithCompanyActionsWithActionsFilteredByOperatingRoundId(
    operatingRoundId: string,
    params: {
      skip?: number;
      take?: number;
      cursor?: Prisma.CompanyWhereUniqueInput;
      where?: Prisma.CompanyWhereInput;
      orderBy?: Prisma.CompanyOrderByWithRelationInput;
    },
  ): Promise<CompanyWithCompanyActions[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.company.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        CompanyActions: {
          where: {
            operatingRoundId,
          },
        },
      },
    });
  }

  async companiesWithCompanyActionsForTurn(
    turnId: string,
    params: {
      skip?: number;
      take?: number;
      cursor?: Prisma.CompanyWhereUniqueInput;
      where?: Prisma.CompanyWhereInput;
      orderBy?: Prisma.CompanyOrderByWithRelationInput;
    },
  ): Promise<CompanyWithCompanyActions[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.company.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        CompanyActions: {
          where: {
            gameTurnId: turnId,
          },
        },
      },
    });
  }
  async companiesWithSector(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CompanyWhereUniqueInput;
    where?: Prisma.CompanyWhereInput;
    orderBy?: Prisma.CompanyOrderByWithRelationInput;
  }): Promise<CompanyWithSector[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.company.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        Sector: true,
        Share: {
          include: {
            Player: true,
          },
        },
      },
    });
  }

  async companiesWithSectorAndStockHistory(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CompanyWhereUniqueInput;
    where?: Prisma.CompanyWhereInput;
    orderBy?: Prisma.CompanyOrderByWithRelationInput;
  }): Promise<CompanyWithSectorAndStockHistory[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.company.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        Share: {
          include: {
            Player: true,
          },
        },
        Sector: true,
        StockHistory: {
          include: {
            Phase: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  async createCompany(data: Prisma.CompanyCreateInput): Promise<Company> {
    //remove id
    delete data.id;
    return this.prisma.company.create({
      data,
    });
  }

  async createManyCompanies(
    data: Prisma.CompanyCreateManyInput[],
  ): Promise<Company[]> {
    //remove id
    data.forEach((d) => delete d.id);
    return this.prisma.company.createManyAndReturn({
      data,
      skipDuplicates: true,
    });
  }

  async updateCompany(params: {
    where: Prisma.CompanyWhereUniqueInput;
    data: Prisma.CompanyUpdateInput;
  }): Promise<Company> {
    const { where, data } = params;
    return this.prisma.company.update({
      data,
      where,
    });
  }

  async updateManyCompanies(
    updates: {
      id: string;
      cashOnHand?: number;
      status?: CompanyStatus;
      prestigeTokens?: number;
      demandScore?: number;
    }[],
  ) {
    // Convert the updates array into the format required by Prisma's updateMany operation
    const updatePromises = updates.map((update) => {
      const data: {
        cashOnHand?: number;
        status?: CompanyStatus;
        prestigeTokens?: number;
        demandScore?: number;
      } = {};

      if (update.cashOnHand !== undefined) {
        data.cashOnHand = update.cashOnHand;
      }
      if (update.status !== undefined) {
        data.status = update.status;
      }
      if (update.prestigeTokens !== undefined) {
        data.prestigeTokens = update.prestigeTokens;
      }
      if (update.demandScore !== undefined) {
        data.demandScore = update.demandScore;
      }

      return this.prisma.company.update({
        where: { id: update.id },
        data,
      });
    });

    // Execute all update promises in parallel
    await Promise.all(updatePromises);
  }

  async deleteCompany(where: Prisma.CompanyWhereUniqueInput): Promise<Company> {
    return this.prisma.company.delete({
      where,
    });
  }
}
