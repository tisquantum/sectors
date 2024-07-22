import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, ShortOrder } from '@prisma/client';
import {
  ShortOrderWithCompany,
  ShortOrderWithRelations,
} from '@server/prisma/prisma.types';

@Injectable()
export class ShortOrderService {
  constructor(private prisma: PrismaService) {}

  async getShortOrder(
    shortOrderWhereUniqueInput: Prisma.ShortOrderWhereUniqueInput,
  ): Promise<ShortOrderWithRelations | null> {
    return this.prisma.shortOrder.findUnique({
      where: shortOrderWhereUniqueInput,
      include: {
        Company: true,
        PlayerOrder: true,
        Share: true,
      },
    });
  }

  async listShortOrders(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ShortOrderWhereUniqueInput;
    where?: Prisma.ShortOrderWhereInput;
    orderBy?: Prisma.ShortOrderOrderByWithRelationInput;
  }): Promise<ShortOrder[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.shortOrder.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createShortOrder(
    data: Prisma.ShortOrderCreateInput,
  ): Promise<ShortOrder> {
    return this.prisma.shortOrder.create({
      data,
    });
  }

  async createManyShortOrders(
    data: Prisma.ShortOrderCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.shortOrder.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async updateShortOrder(params: {
    where: Prisma.ShortOrderWhereUniqueInput;
    data: Prisma.ShortOrderUpdateInput;
  }): Promise<ShortOrder> {
    const { where, data } = params;
    return this.prisma.shortOrder.update({
      data,
      where,
    });
  }

  async deleteShortOrder(
    where: Prisma.ShortOrderWhereUniqueInput,
  ): Promise<ShortOrder> {
    return this.prisma.shortOrder.delete({
      where,
    });
  }
}
