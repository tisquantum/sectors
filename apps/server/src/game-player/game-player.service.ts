import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { GamePlayer, Prisma } from '@prisma/client';
import { PlayersService } from '@server/players/players.service';
import { GamePlayerWithStock } from '@server/prisma/prisma.types';

@Injectable()
export class GamePlayerService {
  constructor(
    private prisma: PrismaService,
    private playersService: PlayersService,
  ) {}

  async gamePlayer(
    gamePlayerWhereUniqueInput: Prisma.GamePlayerWhereUniqueInput,
  ): Promise<GamePlayer | null> {
    return this.prisma.gamePlayer.findUnique({
      where: gamePlayerWhereUniqueInput,
    });
  }

  async gamePlayers(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.GamePlayerWhereUniqueInput;
    where?: Prisma.GamePlayerWhereInput;
    orderBy?: Prisma.GamePlayerOrderByWithRelationInput;
  }): Promise<GamePlayer[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.gamePlayer.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        Player: true,
      },
    });
  }

  async gamePlayersWithStocks(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.GamePlayerWhereUniqueInput;
    where?: Prisma.GamePlayerWhereInput;
    orderBy?: Prisma.GamePlayerOrderByWithRelationInput;
  }): Promise<GamePlayerWithStock[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.gamePlayer.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        Player: {
          include: {
            PlayerStock: {
              include: {
                Stock: true,
              },
            },
          },
        },
      },
    });
  }

  async createGamePlayer(
    data: Prisma.GamePlayerCreateInput,
  ): Promise<GamePlayer> {
    return this.prisma.gamePlayer.create({
      data,
    });
  }

  async createManyGamePlayers(
    data: Prisma.GamePlayerCreateManyInput[],
  ): Promise<GamePlayer[]> {
    return this.prisma.gamePlayer.createManyAndReturn({
      data,
      skipDuplicates: true,
    });
  }

  async updateGamePlayer(params: {
    where: Prisma.GamePlayerWhereUniqueInput;
    data: Prisma.GamePlayerUpdateInput;
  }): Promise<GamePlayer> {
    const { where, data } = params;
    return this.prisma.gamePlayer.update({
      data,
      where,
    });
  }

  async deleteGamePlayer(
    where: Prisma.GamePlayerWhereUniqueInput,
  ): Promise<GamePlayer> {
    return this.prisma.gamePlayer.delete({
      where,
    });
  }
}
