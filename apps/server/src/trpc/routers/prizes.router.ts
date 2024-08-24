import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { PrizeService } from '@server/prize/prize.service';
import { Prisma, Prize } from '@prisma/client';
import { TRPCError } from '@trpc/server';

type Context = {
  prizeService: PrizeService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getPrize: trpc.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { id } = input;
        const prize = await ctx.prizeService.getPrize({ id });
        if (!prize) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Prize not found',
          });
        }
        return prize;
      }),

    listPrizes: trpc.procedure
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
        return ctx.prizeService.listPrizes({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    updatePrize: trpc.procedure
      .input(
        z.object({
          id: z.string(),
          data: z.object({
            playerId: z.string().optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, data } = input;
        try {
          return await ctx.prizeService.updatePrize({
            where: { id },
            data: {
              ...data,
              Player: data.playerId
                ? { connect: { id: data.playerId } }
                : undefined,
            },
          });
        } catch (error) {
          console.error('Error updating prize', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Error updating prize',
          });
        }
      }),
  });
