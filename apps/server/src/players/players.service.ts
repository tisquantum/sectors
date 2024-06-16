import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Player, Prisma } from '@prisma/client';
import { PlayerWithStocks } from '@server/prisma/prisma.types';

@Injectable()
export class PlayersService {
  constructor(private prisma: PrismaService) {}

  async player(
    playerWhereUniqueInput: Prisma.PlayerWhereUniqueInput,
  ): Promise<Player | null> {
    return this.prisma.player.findUnique({
      where: playerWhereUniqueInput,
      include: {
        Game: true,
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

  async deletePlayer(where: Prisma.PlayerWhereUniqueInput): Promise<Player> {
    return this.prisma.player.delete({
      where,
    });
  }

  async playerWithStocks(
    playerWhereUniqueInput: Prisma.PlayerWhereUniqueInput,
  ): Promise<PlayerWithStocks | null> {
    return this.prisma.player.findUnique({
      where: playerWhereUniqueInput,
      include: {
        Stock: true,
      },
    });
  }

  async playersWithStocks(
    playerWhereInput: Prisma.PlayerWhereInput,
  ): Promise<PlayerWithStocks[]> {
    return this.prisma.player.findMany({
      where: playerWhereInput,
      include: {
        Stock: true,
      },
    });
  }
}
