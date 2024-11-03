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
    getCurrentGameTurnWithRelations: trpc.procedure
      .input(z.object({ gameId: z.string() }))
      .query(async ({ input }) => {
        const { gameId } = input;
        return ctx.gameTurnService.getCurrentTurnWithRelations(gameId);
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
  });
