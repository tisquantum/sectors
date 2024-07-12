import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, PrestigeRewards } from '@prisma/client';

@Injectable()
export class PrestigeRewardsService {
  constructor(private prisma: PrismaService) {}

  async getPrestigeReward(
    prestigeRewardWhereUniqueInput: Prisma.PrestigeRewardsWhereUniqueInput,
  ): Promise<PrestigeRewards | null> {
    return this.prisma.prestigeRewards.findUnique({
      where: prestigeRewardWhereUniqueInput,
    });
  }

  async listPrestigeRewards(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PrestigeRewardsWhereUniqueInput;
    where?: Prisma.PrestigeRewardsWhereInput;
    orderBy?: Prisma.PrestigeRewardsOrderByWithRelationInput;
  }): Promise<PrestigeRewards[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.prestigeRewards.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createPrestigeReward(
    data: Prisma.PrestigeRewardsCreateInput,
  ): Promise<PrestigeRewards> {
    return this.prisma.prestigeRewards.create({
      data,
    });
  }

  async createManyPrestigeRewards(
    data: Prisma.PrestigeRewardsCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.prestigeRewards.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async updatePrestigeReward(params: {
    where: Prisma.PrestigeRewardsWhereUniqueInput;
    data: Prisma.PrestigeRewardsUpdateInput;
  }): Promise<PrestigeRewards> {
    const { where, data } = params;
    return this.prisma.prestigeRewards.update({
      data,
      where,
    });
  }

  async deletePrestigeReward(
    where: Prisma.PrestigeRewardsWhereUniqueInput,
  ): Promise<PrestigeRewards> {
    return this.prisma.prestigeRewards.delete({
      where,
    });
  }
}
