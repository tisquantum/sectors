import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { ExecutivePlayerService } from '@server/executive-player/executive-player.service';

type Context = {
  executivePlayerService: ExecutivePlayerService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    // Retrieve a specific ExecutivePlayer by unique input
    getExecutivePlayer: trpc.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { id } = input;
        const player = await ctx.executivePlayerService.getExecutivePlayer({ id });
        if (!player) {
          throw new Error('ExecutivePlayer not found');
        }
        return player;
      }),

    // List all ExecutivePlayers with optional filtering, pagination, and sorting
    listExecutivePlayers: trpc.procedure
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
        return ctx.executivePlayerService.listExecutivePlayers({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),
  });
