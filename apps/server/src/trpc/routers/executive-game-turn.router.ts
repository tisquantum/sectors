import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { ExecutiveGameTurnService } from '@server/executive-game-turn/executive-game-turn.service';

type Context = {
  executiveGameTurnService: ExecutiveGameTurnService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    // Retrieve a specific ExecutiveGameTurn by unique input
    getExecutiveGameTurn: trpc.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { id } = input;
        const turn = await ctx.executiveGameTurnService.getExecutiveGameTurn({ id });
        if (!turn) {
          throw new Error('ExecutiveGameTurn not found');
        }
        return turn;
      }),

    // List all ExecutiveGameTurns with optional filtering, pagination, and sorting
    listExecutiveGameTurns: trpc.procedure
      .input(
        z.object({
          skip: z.number().optional(),
          take: z.number().optional(),
          cursor: z.string().optional(),
          where: z.any().optional(),
          orderBy: z.any().optional(),
        })
      )
      .query(async ({ input }) => {
        const { skip, take, cursor, where, orderBy } = input;
        return ctx.executiveGameTurnService.listExecutiveGameTurns({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    // Retrieve the latest turn for a specific game
    getLatestTurn: trpc.procedure
      .input(z.object({ gameId: z.string() }))
      .query(async ({ input }) => {
        const { gameId } = input;
        const latestTurn = await ctx.executiveGameTurnService.getLatestTurn(gameId);
        if (!latestTurn) {
          throw new Error('Latest turn not found for the specified game');
        }
        return latestTurn;
      }),

    // Retrieve all turns for a specific game
    getTurnsForGame: trpc.procedure
      .input(z.object({ gameId: z.string() }))
      .query(async ({ input }) => {
        const { gameId } = input;
        const turns = await ctx.executiveGameTurnService.getTurnsForGame(gameId);
        if (turns.length === 0) {
          throw new Error('No turns found for the specified game');
        }
        return turns;
      }),
  });
