import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { GamePlayerService } from '../game-player/game-player.service';
import { PlayersService } from '@server/players/players.service';
import { GamePlayer, Prisma } from '@prisma/client';
import { GamesService } from '@server/games/games.service';

interface StartGameInput {
  gameId: string;
  roomId: number;
  startingCashOnHand: number;
  consumerPoolNumber: number;
  bankPoolNumber: number;
}

@Injectable()
export class GameManagementService {
  constructor(
    private prisma: PrismaService,
    private gamePlayerService: GamePlayerService,
    private playersService: PlayersService,
    private gamesService: GamesService,
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

  async startGame(input: StartGameInput): Promise<Game> {
    const {
      gameId,
      roomId,
      startingCashOnHand,
      consumerPoolNumber,
      bankPoolNumber,
    } = input;

    const gameData: Prisma.GameCreateInput = {
      id: gameId,
      name: `Game_${gameId}`,
      currentTurn: 0,
      currentOrSubRound: 0,
      currentRound: 'initial',
      bankPoolNumber,
      consumerPoolNumber,
      gameStatus: 'started',
    };

    try {
      // Create the game
      const game = await this.gamesService.createGame(gameData);

      // Add players to the game
      await this.addPlayersToGame(game.id, roomId, startingCashOnHand);

      return game;
    } catch (error) {
      console.error('Error starting game:', error);
      throw new Error('Failed to start the game');
    }
  }
}
