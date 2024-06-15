import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { GameCompany, Prisma } from '@prisma/client';

@Injectable()
export class GameCompanyService {
  constructor(private prisma: PrismaService) {}

  async gameCompany(
    gameCompanyWhereUniqueInput: Prisma.GameCompanyWhereUniqueInput,
  ): Promise<GameCompany | null> {
    return this.prisma.gameCompany.findUnique({
      where: gameCompanyWhereUniqueInput,
    });
  }

  async gameCompanies(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.GameCompanyWhereUniqueInput;
    where?: Prisma.GameCompanyWhereInput;
    orderBy?: Prisma.GameCompanyOrderByWithRelationInput;
  }): Promise<GameCompany[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.gameCompany.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createGameCompany(
    data: Prisma.GameCompanyCreateInput,
  ): Promise<GameCompany> {
    return this.prisma.gameCompany.create({
      data,
    });
  }

  async createManyGameCompanies(
    data: Prisma.GameCompanyCreateManyInput[],
  ): Promise<GameCompany[]> {
    return this.prisma.gameCompany.createManyAndReturn({
      data,
      skipDuplicates: true,
    });
  }

  async updateGameCompany(params: {
    where: Prisma.GameCompanyWhereUniqueInput;
    data: Prisma.GameCompanyUpdateInput;
  }): Promise<GameCompany> {
    const { where, data } = params;
    return this.prisma.gameCompany.update({
      data,
      where,
    });
  }

  async deleteGameCompany(
    where: Prisma.GameCompanyWhereUniqueInput,
  ): Promise<GameCompany> {
    return this.prisma.gameCompany.delete({
      where,
    });
  }
}
