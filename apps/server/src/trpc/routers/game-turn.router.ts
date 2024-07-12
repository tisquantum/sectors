import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { Prisma } from '@prisma/client';
import { GameTurnService } from '@server/game-turn/game-turn.service';

type Context = {
  gameTurnService: GameTurnService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getGameTurn: trpc.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { id } = input;
        const gameTurn = await ctx.gameTurnService.gameTurn({ id });
        if (!gameTurn) {
          throw new Error('GameTurn not found');
        }
        return gameTurn;
      }),

    getCurrentGameTurn: trpc.procedure
      .input(z.object({ gameId: z.string() }))
      .query(async ({ input }) => {
        const { gameId } = input;
        return ctx.gameTurnService.getCurrentTurn(gameId);
      }),

    listGameTurns: trpc.procedure
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
        return ctx.gameTurnService.gameTurns({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    createGameTurn: trpc.procedure
      .input(
        z.object({
          gameId: z.string(),
          turn: z.number(),
        }),
      )
      .mutation(async ({ input }) => {
        const { gameId, ...rest } = input;
        return ctx.gameTurnService.createGameTurn({
          ...rest,
          game: { connect: { id: gameId } },
        });
      }),

    createManyGameTurns: trpc.procedure
      .input(
        z.array(
          z.object({
            gameId: z.string(),
            turn: z.number(),
          }),
        ),
      )
      .mutation(async ({ input }) => {
        const data: Prisma.GameTurnCreateManyInput[] = input;
        return ctx.gameTurnService.createManyGameTurns(data);
      }),

    updateGameTurn: trpc.procedure
      .input(
        z.object({
          id: z.string(),
          data: z.object({
            gameId: z.string().optional(),
            turn: z.number().optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, data } = input;
        return ctx.gameTurnService.updateGameTurn({ where: { id }, data });
      }),

    deleteGameTurn: trpc.procedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const { id } = input;
        return ctx.gameTurnService.deleteGameTurn({ id });
      }),
  });
