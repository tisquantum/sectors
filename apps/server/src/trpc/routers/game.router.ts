import { PusherService } from 'nestjs-pusher';
import { z } from 'zod';
import { GamesService } from '@server/games/games.service';
import { TrpcService } from '../trpc.service';
import { Prisma } from '@prisma/client';
import { GameManagementService } from '@server/game-management/game-management.service';

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
          name: z.string(),
          currentTurn: z.number(),
          currentOrSubRound: z.number(),
          currentRound: z.string(),
          currentActivePlayer: z.string().nullable().optional(),
          bankPoolNumber: z.number(),
          consumerPoolNumber: z.number(),
          gameStatus: z.string(),
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
        const data: Prisma.GameCreateInput = input;
        try {
          const game = await ctx.gamesService.createGame(data);

          try {
            ctx.gameManagementService.addPlayersToGame(
              game.id,
              input.roomId,
              input.startingCashOnHand,
            );
          } catch (error) {
            return {
              success: false,
              message: 'Error adding players to game',
              data: error,
            };
          }

          return {
            success: true,
            message: 'Game started successfully',
            data: game,
          };
        } catch (error) {
          return {
            success: false,
            message: 'Error starting game',
            data: error,
          };
        }
      }),

    updateGame: trpc.procedure
      .input(
        z.object({
          id: z.string(),
          data: z.object({
            name: z.string().optional(),
            currentTurn: z.number().optional(),
            currentOrSubRound: z.number().optional(),
            currentRound: z.string().optional(),
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
  });
