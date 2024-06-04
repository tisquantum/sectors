import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { GamePlayerService } from '../game-player/game-player.service';
import { PlayersService } from '@server/players/players.service';
import { GamePlayer } from '@prisma/client';

@Injectable()
export class GameManagementService {
  constructor(
    private prisma: PrismaService,
    private gamePlayerService: GamePlayerService,
    private playersService: PlayersService,
  ) {}

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

    // Create players for the game
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
        this.gamePlayerService.createGamePlayer({
          Game: { connect: { id: gameId } },
          Player: { connect: { id: player.id } },
        }),
      ),
    );
  }
}
