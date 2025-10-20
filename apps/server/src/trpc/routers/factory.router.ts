import { z } from 'zod';
import { FactoryService, CreateFactorySchema } from '../../factory/factory.service';
import { TrpcService } from '../trpc.service';
import { PrismaService } from '@server/prisma/prisma.service';

type Context = {
  factoryService: FactoryService;
  prismaService?: PrismaService;
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

    getFactoryWithProduction: trpc.procedure
      .input(z.object({
        factoryId: z.string(),
        gameTurnId: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const factory = await ctx.factoryService.getFactoryDetails(input.factoryId);
        if (!factory) {
          throw new Error('Factory not found');
        }

        // Get production records if gameTurnId provided
        let productionRecords = null;
        if (input.gameTurnId && ctx.prismaService) {
          productionRecords = await ctx.prismaService.factoryProduction.findMany({
            where: {
              factoryId: input.factoryId,
              gameTurnId: input.gameTurnId,
            },
          });
        }

        return {
          ...factory,
          productionRecords,
        };
      }),

    getCompanyFactoriesWithProduction: trpc.procedure
      .input(z.object({
        companyId: z.string(),
        gameId: z.string(),
        gameTurnId: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const factories = await ctx.factoryService.getCompanyFactories(
          input.companyId,
          input.gameId
        );

        // If gameTurnId provided and prisma available, fetch production records
        if (input.gameTurnId && ctx.prismaService) {
          const factoriesWithProduction = await Promise.all(
            factories.map(async (factory) => {
              const productionRecords = await ctx.prismaService!.factoryProduction.findMany({
                where: {
                  factoryId: factory.id,
                  gameTurnId: input.gameTurnId,
                },
              });

              return {
                ...factory,
                productionRecords,
              };
            })
          );

          return factoriesWithProduction;
        }

        return factories;
      }),
  }); 