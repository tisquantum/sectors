import { z } from 'zod';
import { HeadlineService } from '@server/headline/headline.service';
import { TrpcService } from '../trpc.service';
import { HeadlineName, Prisma } from '@prisma/client';

type Context = {
  headlineService: HeadlineService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getHeadline: trpc.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { id } = input;
        const headline = await ctx.headlineService.getHeadline({ id });
        if (!headline) {
          throw new Error('Headline not found');
        }
        return headline;
      }),

    listHeadlines: trpc.procedure
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
        return ctx.headlineService.listHeadlines({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    updateHeadline: trpc.procedure
      .input(
        z.object({
          id: z.string(),
          name: z.nativeEnum(HeadlineName).optional(),
          cost: z.number().optional(),
          timestamp: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return ctx.headlineService.updateHeadline({
          where: { id },
          data,
        });
      }),
  });
