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

    createPlayerPriority: trpc.procedure
      .input(
        z.object({
          gameTurnId: z.string(),
          playerId: z.string(),
          priority: z.number(),
        }),
      )
      .mutation(async ({ input }) => {
        const { gameTurnId, playerId, priority } = input;
        const data = {
          priority,
          gameTurn: { connect: { id: gameTurnId } },
          player: { connect: { id: playerId } },
        };

        return ctx.playerPriorityService.createPlayerPriority(data);
      }),

    createManyPlayerPriorities: trpc.procedure
      .input(
        z.array(
          z.object({
            gameTurnId: z.string(),
            playerId: z.string(),
            priority: z.number(),
          }),
        ),
      )
      .mutation(async ({ input }) => {
        const data = input.map(({ gameTurnId, playerId, priority }) => ({
          gameTurnId,
          playerId,
          priority,
        }));
        return ctx.playerPriorityService.createManyPlayerPriorities(data);
      }),

    updatePlayerPriority: trpc.procedure
      .input(
        z.object({
          id: z.string(),
          data: z.object({
            gameTurnId: z.string().optional(),
            playerId: z.string().optional(),
            priority: z.number().optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, data } = input;
        return ctx.playerPriorityService.updatePlayerPriority({
          where: { id },
          data,
        });
      }),

    deletePlayerPriority: trpc.procedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const { id } = input;
        return ctx.playerPriorityService.deletePlayerPriority({ id });
      }),
  });
