import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, Share } from '@prisma/client';

@Injectable()
export class ShareService {
  constructor(private prisma: PrismaService) {}

  async share(
    shareWhereUniqueInput: Prisma.ShareWhereUniqueInput,
  ): Promise<Share | null> {
    return this.prisma.share.findUnique({
      where: shareWhereUniqueInput,
    });
  }

  async shares(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ShareWhereUniqueInput;
    where?: Prisma.ShareWhereInput;
    orderBy?: Prisma.ShareOrderByWithRelationInput;
  }): Promise<Share[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.share.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createShare(data: Prisma.ShareCreateInput): Promise<Share> {
    return this.prisma.share.create({
      data,
    });
  }

  async createManyShares(data: Prisma.ShareCreateManyInput[]): Promise<Prisma.BatchPayload> {
    return this.prisma.share.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async updateShare(params: {
    where: Prisma.ShareWhereUniqueInput;
    data: Prisma.ShareUpdateInput;
  }): Promise<Share> {
    const { where, data } = params;
    return this.prisma.share.update({
      data,
      where,
    });
  }

  async updateManyShares(params: {
    where: Prisma.ShareWhereInput;
    data: Prisma.ShareUpdateManyMutationInput;
  }): Promise<Prisma.BatchPayload> {
    const { where, data } = params;
    return this.prisma.share.updateMany({
      data,
      where,
    });
  }

  async updateManySharesUnchecked(params: {
    where: Prisma.ShareWhereInput;
    data: Prisma.ShareUncheckedUpdateManyInput;
  }): Promise<Prisma.BatchPayload> {
    const { where, data } = params;
    return this.prisma.share.updateMany({
      data,
      where,
    });
  }

  async deleteShare(where: Prisma.ShareWhereUniqueInput): Promise<Share> {
    return this.prisma.share.delete({
      where,
    });
  }
}
