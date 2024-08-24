import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { PlayerPriorityService } from '@server/player-priority/player-priority.service';
import { Prisma } from '@prisma/client';

type Context = {
  playerPriorityService: PlayerPriorityService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getPlayerPriority: trpc.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { id } = input;
        const playerPriority =
          await ctx.playerPriorityService.getPlayerPriority({ id });
        if (!playerPriority) {
          throw new Error('PlayerPriority not found');
        }
        return playerPriority;
      }),

    listPlayerPriorities: trpc.procedure
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
        return ctx.playerPriorityService.listPlayerPriorities({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),
  });
