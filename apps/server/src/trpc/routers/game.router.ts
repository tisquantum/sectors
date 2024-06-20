import { PusherService } from 'nestjs-pusher';
import { z } from 'zod';
import { GamesService } from '@server/games/games.service';
import { TrpcService } from '../trpc.service';
import { Game, Prisma, RoundType } from '@prisma/client';
import { GameManagementService } from '@server/game-management/game-management.service';
import { EVENT_GAME_STARTED, getRoomChannelId } from '@server/pusher/pusher.types';

type Context = {
  gamesService: GamesService;
  gameManagementService: GameManagementService;
  pusherService: PusherService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getGame: trpc.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { id } = input;
        const game = await ctx.gamesService.game({ id });
        if (!game) {
          throw new Error('Game not found');
        }
        return game;
      }),

    listGames: trpc.procedure
      .input(
        z.object({
          skip: z.number().optional(),
          take: z.number().optional(),
          cursor: z.string().optional(),
          where: z.any().optional(),
          orderBy: z.any().optional(),
        }),
      )
      .query(async ({ input }) => {
        const { skip, take, cursor, where, orderBy } = input;
        return ctx.gamesService.games({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    startGame: trpc.procedure
      .input(
        z.object({
          currentActivePlayer: z.string().nullable().optional(),
          bankPoolNumber: z.number(),
          consumerPoolNumber: z.number(),
          roomId: z.number(),
          startingCashOnHand: z.number(),
          players: z.any().optional(),
          companies: z.any().optional(),
          Player: z.any().optional(),
          Company: z.any().optional(),
          StockRound: z.any().optional(),
          OperatingRound: z.any().optional(),
          ResearchDeck: z.any().optional(),
          Room: z.any().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        let game: Game;
        try {
          game = await ctx.gameManagementService.startGame({
            roomId: input.roomId,
            startingCashOnHand: input.startingCashOnHand,
            consumerPoolNumber: input.consumerPoolNumber,
            bankPoolNumber: input.bankPoolNumber,
          });
        } catch (error) {
          return {
            success: false,
            message: 'Error adding players to game',
            data: error,
          };
        }

        // Notify all users in the room that the game has started
        ctx.pusherService.trigger(getRoomChannelId(input.roomId), EVENT_GAME_STARTED, {
          gameId: game.id,
        });

        return {
          success: true,
          message: 'Game started successfully',
        };
      }),

    updateGame: trpc.procedure
      .input(
        z.object({
          id: z.string(),
          data: z.object({
            name: z.string().optional(),
            currentTurn: z.number().optional(),
            currentOrSubRound: z.number().optional(),
            currentRound: z.nativeEnum(RoundType),
            currentActivePlayer: z.string().nullable().optional(),
            bankPoolNumber: z.number().optional(),
            consumerPoolNumber: z.number().optional(),
            gameStatus: z.string().optional(),
            players: z.any().optional(),
            companies: z.any().optional(),
            Player: z.any().optional(),
            Company: z.any().optional(),
            StockRound: z.any().optional(),
            OperatingRound: z.any().optional(),
            ResearchDeck: z.any().optional(),
            Room: z.any().optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, data } = input;
        return ctx.gamesService.updateGame({ where: { id }, data });
      }),

    deleteGame: trpc.procedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const { id } = input;
        return ctx.gamesService.deleteGame({ id });
      }),

    getPlayersWithStocks: trpc.procedure
      .input(z.object({ gameId: z.string() }))
      .query(async ({ input }) => {
        const { gameId } = input;
        return ctx.gameManagementService.getPlayersWithStocks(gameId);
      }),

    getGameState: trpc.procedure
      .input(z.object({ gameId: z.string() }))
      .query(async ({ input }) => {
        const { gameId } = input;
        return ctx.gamesService.getGameState(gameId);
      }),
  });
