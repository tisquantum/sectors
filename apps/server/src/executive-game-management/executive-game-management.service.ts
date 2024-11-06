import { Injectable } from '@nestjs/common';
import { ExecutivePlayer } from '@prisma/client';
import { ExecutiveCardService } from '@server/executive-card/executive-card.service';
import { ExecutiveGameService } from '@server/executive-game/executive-game.service';
import { ExecutivePlayerService } from '@server/executive-player/executive-player.service';
import { PrismaService } from '@server/prisma/prisma.service';

@Injectable()
export class ExecutiveGameManagementService {
  constructor(
    private prisma: PrismaService,
    private gameService: ExecutiveGameService,
    private playerService: ExecutivePlayerService,
    private cardService: ExecutiveCardService,
  ) {}

  async startGame(roomId: number, gameName: string) {
    //create the game
    const game = await this.gameService.createExecutiveGame({ name: gameName });
    //add players to the game
    await this.addPlayersToGame(game.id, roomId);
    //create the cards and add them to the deck
    await this.cardService.createDeck(game.id);
  }

  async addPlayersToGame(
    gameId: string,
    roomId: number,
  ): Promise<ExecutivePlayer[]> {
    const users = await this.prisma.roomUser.findMany({
      where: {
        roomId,
      },
      include: {
        user: true,
      },
    });

    return await this.playerService.createManyExecutivePlayers(
      users.map((user) => ({
        userId: user.userId,
        gameId,
      })),
    );
  }
}
