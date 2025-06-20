import { z } from 'zod';
import { FactoryService, CreateFactorySchema } from '../../factory/factory.service';
import { TrpcService } from '../trpc.service';

type Context = {
  factoryService: FactoryService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    createBlueprint: trpc.procedure
      .input(CreateFactorySchema)
      .mutation(async ({ input }) => {
        return ctx.factoryService.createFactory(input);
      }),

    buildFactory: trpc.procedure
      .input(CreateFactorySchema)
      .mutation(async ({ input }) => {
        return ctx.factoryService.createFactory(input);
      }),

    assignWorkers: trpc.procedure
      .input(z.object({
        factoryId: z.string(),
        workerCount: z.number().int().positive(),
      }))
      .mutation(async ({ input }) => {
        return ctx.factoryService.assignWorkers(input.factoryId, input.workerCount);
      }),

    getFactoryDetails: trpc.procedure
      .input(z.string())
      .query(async ({ input }) => {
        const factory = await ctx.factoryService.getFactoryDetails(input);
        if (!factory) {
          throw new Error('Factory not found');
        }
        return factory;
      }),

    getCompanyFactories: trpc.procedure
      .input(z.object({
        companyId: z.string(),
        gameId: z.string(),
      }))
      .query(async ({ input }) => {
        return ctx.factoryService.getCompanyFactories(input.companyId, input.gameId);
      }),
  }); 