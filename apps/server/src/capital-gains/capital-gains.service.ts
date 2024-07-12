import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, CapitalGains } from '@prisma/client';

@Injectable()
export class CapitalGainsService {
  constructor(private prisma: PrismaService) {}

  async capitalGains(
    capitalGainsWhereUniqueInput: Prisma.CapitalGainsWhereUniqueInput,
  ): Promise<CapitalGains | null> {
    return this.prisma.capitalGains.findUnique({
      where: capitalGainsWhereUniqueInput,
    });
  }

  async capitalGainsFirst(params: {
    where?: Prisma.CapitalGainsWhereInput;
    orderBy?: Prisma.CapitalGainsOrderByWithRelationInput;
  }): Promise<CapitalGains | null> {
    const { where, orderBy } = params;
    return this.prisma.capitalGains.findFirst({
      where,
      orderBy,
      include: {
        Game: true,
        Player: true,
      },
    });
  }

  async capitalGainsList(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CapitalGainsWhereUniqueInput;
    where?: Prisma.CapitalGainsWhereInput;
    orderBy?: Prisma.CapitalGainsOrderByWithRelationInput;
  }): Promise<CapitalGains[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.capitalGains.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createCapitalGains(
    data: Prisma.CapitalGainsCreateInput,
  ): Promise<CapitalGains> {
    return this.prisma.capitalGains.create({
      data,
    });
  }

  async createManyCapitalGains(
    data: Prisma.CapitalGainsCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    // Remove id if exists
    data.forEach((d) => delete d.id);
    return this.prisma.capitalGains.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async updateCapitalGains(params: {
    where: Prisma.CapitalGainsWhereUniqueInput;
    data: Prisma.CapitalGainsUpdateInput;
  }): Promise<CapitalGains> {
    const { where, data } = params;
    return this.prisma.capitalGains.update({
      data,
      where,
    });
  }

  async deleteCapitalGains(
    where: Prisma.CapitalGainsWhereUniqueInput,
  ): Promise<CapitalGains> {
    return this.prisma.capitalGains.delete({
      where,
    });
  }
}
