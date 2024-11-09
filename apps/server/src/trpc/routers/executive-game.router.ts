import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { ExecutiveGameService } from '@server/executive-game/executive-game.service';
import { ExecutiveGameManagementService } from '@server/executive-game-management/executive-game-management.service';

type Context = {
  executiveGameService: ExecutiveGameService;
  executiveGameManagementService: ExecutiveGameManagementService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    // Retrieve a specific ExecutiveGame by unique input
    getExecutiveGame: trpc.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { id } = input;
        const game = await ctx.executiveGameService.getExecutiveGame({ id });
        if (!game) {
          throw new Error('ExecutiveGame not found');
        }
        return game;
      }),

    // List all ExecutiveGames with optional filtering, pagination, and sorting
    listExecutiveGames: trpc.procedure
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
        return ctx.executiveGameService.listExecutiveGames({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),
    startGame: trpc.procedure
      .input(z.object({ roomId: z.number(), gameName: z.string() }))
      .mutation(async ({ input }) => {
        const { roomId, gameName } = input;
        await ctx.executiveGameManagementService.startGame(roomId, gameName);
      }),
    createInfluenceBid: trpc.procedure
      .input(
        z.object({
          fromPlayerId: z.string(),
          toPlayerId: z.string(),
          influenceAmount: z.number(),
        }),
      )
      .mutation(async ({ input }) => {
        const { fromPlayerId, toPlayerId, influenceAmount } = input;
        await ctx.executiveGameManagementService.createExecutiveInfluenceBidFromClient(
          {
            fromPlayerId,
            toPlayerId,
            influenceAmount,
          },
        );
        return { success: true };
      }),
    playerPass: trpc.procedure
      .input(z.object({ playerId: z.string() }))
      .mutation(async ({ input }) => {
        const { playerId } = input;
        console.log('playerPass', playerId);
        await ctx.executiveGameManagementService.playerPass(playerId);
        return { success: true };
      }),

    selectInfluenceBid: trpc.procedure
      .input(z.object({ influenceBidId: z.string() }))
      .mutation(async ({ input }) => {
        const { influenceBidId } = input;
        // await ctx.executiveGameManagementService.selectInfluenceBid(
        //   influenceBidId,
        // );
        return { success: true };
      }),
  });
