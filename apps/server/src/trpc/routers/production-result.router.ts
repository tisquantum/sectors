import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { ProductionResultService } from '@server/production-result/production-result.service';

type Context = {
  productionResultService: ProductionResultService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getProductionResult: trpc.procedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { id } = input;
        const productionResult =
          await ctx.productionResultService.productionResult({ id });
        if (!productionResult) {
          throw new Error('ProductionResult not found');
        }
        return productionResult;
      }),

    listProductionResults: trpc.procedure
      .input(
        z.object({
          skip: z.number().optional(),
          take: z.number().optional(),
          cursor: z.number().optional(),
          where: z.any().optional(),
          orderBy: z.any().optional(),
        }),
      )
      .query(async ({ input }) => {
        const { skip, take, cursor, where, orderBy } = input;
        return ctx.productionResultService.productionResults({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),
  });
