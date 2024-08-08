import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { OrderType, Player, Prisma } from '@prisma/client';
import {
  PlayerWithPlayerOrders,
  PlayerWithShares,
} from '@server/prisma/prisma.types';

@Injectable()
export class PlayersService {
  constructor(private prisma: PrismaService) {}

  async player(
    playerWhereInput: Prisma.PlayerWhereInput,
  ): Promise<PlayerWithPlayerOrders | null> {
    return this.prisma.player.findFirst({
      where: playerWhereInput,
      include: {
        PlayerOrder: true,
      },
    });
  }

  async players(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PlayerWhereUniqueInput;
    where?: Prisma.PlayerWhereInput;
    orderBy?: Prisma.PlayerOrderByWithRelationInput;
  }): Promise<Player[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.player.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createPlayer(data: Prisma.PlayerCreateInput): Promise<Player> {
    return this.prisma.player.create({
      data,
    });
  }

  async createManyPlayers(
    data: Prisma.PlayerCreateManyInput[],
  ): Promise<Player[]> {
    return this.prisma.player.createManyAndReturn({
      data,
      skipDuplicates: true,
    });
  }

  async updatePlayer(params: {
    where: Prisma.PlayerWhereUniqueInput;
    data: Prisma.PlayerUpdateInput;
  }): Promise<Player> {
    const { where, data } = params;
    return this.prisma.player.update({
      data,
      where,
    });
  }

  async updateManyPlayers(params: {
    where: Prisma.PlayerWhereInput;
    data: Prisma.PlayerUpdateManyMutationInput;
  }): Promise<Prisma.BatchPayload> {
    const { where, data } = params;
    return this.prisma.player.updateMany({
      data,
      where,
    });
  }

  async deletePlayer(where: Prisma.PlayerWhereUniqueInput): Promise<Player> {
    return this.prisma.player.delete({
      where,
    });
  }

  async playerWithShares(
    playerWhereUniqueInput: Prisma.PlayerWhereUniqueInput,
  ): Promise<PlayerWithShares | null> {
    return this.prisma.player.findUnique({
      where: playerWhereUniqueInput,
      include: {
        Share: {
          include: {
            Company: true,
          },
        },
      },
    });
  }

  async playersWithShares(
    playerWhereInput: Prisma.PlayerWhereInput,
  ): Promise<PlayerWithShares[]> {
    return this.prisma.player.findMany({
      where: playerWhereInput,
      include: {
        Share: {
          include: { Company: true },
        },
      },
    });
  }

  async addActionCounter(
    playerId: string,
    orderType: OrderType,
  ): Promise<Player> {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
    });
    if (!player) {
      throw new Error('Player not found');
    }
    if (orderType === OrderType.MARKET) {
      player.marketOrderActions += 1;
    }
    if (orderType === OrderType.LIMIT) {
      player.limitOrderActions += 1;
    }
    if (orderType === OrderType.SHORT) {
      player.shortOrderActions += 1;
    }
    return this.prisma.player.update({
      where: { id: playerId },
      data: player,
    });
  }

  async subtractActionCounter(
    playerId: string,
    orderType: OrderType,
  ): Promise<Player> {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
    });
    if (!player) {
      throw new Error('Player not found');
    }
    if (orderType === OrderType.MARKET) {
      player.marketOrderActions -= 1;
    }
    if (orderType === OrderType.LIMIT) {
      player.limitOrderActions -= 1;
    }
    if (orderType === OrderType.SHORT) {
      player.shortOrderActions -= 1;
    }
    return this.prisma.player.update({
      where: { id: playerId },
      data: player,
    });
  }
}
