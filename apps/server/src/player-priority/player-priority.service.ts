import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, PlayerPriority } from '@prisma/client';
import { PlayerPriorityWithPlayer } from '@server/prisma/prisma.types';

@Injectable()
export class PlayerPriorityService {
  constructor(private prisma: PrismaService) {}

  async getPlayerPriority(
    playerPriorityWhereUniqueInput: Prisma.PlayerPriorityWhereUniqueInput,
  ): Promise<PlayerPriority | null> {
    return this.prisma.playerPriority.findUnique({
      where: playerPriorityWhereUniqueInput,
    });
  }

  async listPlayerPriorities(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PlayerPriorityWhereUniqueInput;
    where?: Prisma.PlayerPriorityWhereInput;
    orderBy?: Prisma.PlayerPriorityOrderByWithRelationInput;
  }): Promise<PlayerPriorityWithPlayer[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.playerPriority.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        player: true,
      },
    });
  }

  async createPlayerPriority(
    data: Prisma.PlayerPriorityCreateInput,
  ): Promise<PlayerPriority> {
    return this.prisma.playerPriority.create({
      data,
    });
  }

  async createManyPlayerPriorities(
    data: Prisma.PlayerPriorityCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.playerPriority.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async updatePlayerPriority(params: {
    where: Prisma.PlayerPriorityWhereUniqueInput;
    data: Prisma.PlayerPriorityUpdateInput;
  }): Promise<PlayerPriority> {
    const { where, data } = params;
    return this.prisma.playerPriority.update({
      data,
      where,
    });
  }

  async deletePlayerPriority(
    where: Prisma.PlayerPriorityWhereUniqueInput,
  ): Promise<PlayerPriority> {
    return this.prisma.playerPriority.delete({
      where,
    });
  }
}
