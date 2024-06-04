import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { GamePlayer, Prisma } from '@prisma/client';
import { PlayersService } from '@server/players/players.service';

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
    });
  }

  async createGamePlayer(
    data: Prisma.GamePlayerCreateInput,
  ): Promise<GamePlayer> {
    return this.prisma.gamePlayer.create({
      data,
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

  async addPlayersToGame(
    gameId: string,
    roomId: number,
    startingCashOnHand: number,
  ): Promise<GamePlayer[]> {
    const users = await this.prisma.roomUser.findMany({
      where: {
        roomId,
      },
      include: {
        user: true,
      },
    });

    //create players for the game
    const players = await Promise.all(
      users.map((user) =>
        this.playersService.createPlayer({
          nickname: user.user.name,
          cashOnHand: startingCashOnHand,
          Game: { connect: { id: gameId } },
        }),
      ),
    );

    return Promise.all(
      players.map((player) =>
        this.createGamePlayer({
          Game: { connect: { id: gameId } },
          Player: { connect: { id: player.id } },
        }),
      ),
    );
  }
}
