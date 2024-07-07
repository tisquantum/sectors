import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, CompanyAction } from '@prisma/client';

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

  async companyActionFirst(
    params: {
      where?: Prisma.CompanyActionWhereInput;
      orderBy?: Prisma.CompanyActionOrderByWithRelationInput;
    },
  ): Promise<CompanyAction | null> {
    const { where, orderBy } = params;
    return this.prisma.companyAction.findFirst({
      where,
      orderBy,
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
