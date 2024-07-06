import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, Company, Sector } from '@prisma/client';
import { CompanyWithSector, CompanyWithSectorAndStockHistory } from '@server/prisma/prisma.types';
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
        Sector: true,
        StockHistory: {
          include: {
            Phase: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        }
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

  async deleteCompany(where: Prisma.CompanyWhereUniqueInput): Promise<Company> {
    return this.prisma.company.delete({
      where,
    });
  }
}
