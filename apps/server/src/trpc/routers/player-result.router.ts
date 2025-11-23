import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { PlayerResultService } from '@server/player-result/player-result.service';
import { groupBy } from '@server/data/helpers';

type Context = {
  playerResultService: PlayerResultService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getPlayerResultById: trpc.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { id } = input;
        const playerResult =
          await ctx.playerResultService.getPlayerResultById(id);
        if (!playerResult) {
          throw new Error('PlayerResult not found');
        }
        return playerResult;
      }),

    listPlayerResults: trpc.procedure
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
        return ctx.playerResultService.listPlayerResults({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),
    groupByUserIdAndSumRankingPoints: trpc.procedure
      .input(
        z.object({
          where: z.any().optional(),
          orderBy: z.any().optional(),
        }),
      )
      .query(async ({ input }) => {
        const { where, orderBy } = input;
        return ctx.playerResultService.groupPlayerResultsByUserIdAndSumRankingPoints(
          {
            where,
            orderBy,
          },
        );
      }),
  });
