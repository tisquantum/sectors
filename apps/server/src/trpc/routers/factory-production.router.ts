import { z } from 'zod';
import { FactoryProductionService } from '../../factory-production/factory-production.service';
import { TrpcService } from '../trpc.service';

type Context = {
  factoryProductionService: FactoryProductionService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getFactoryProduction: trpc.procedure
      .input(z.object({
        factoryId: z.string(),
        gameTurnId: z.string(),
      }))
      .query(async ({ input }) => {
        return ctx.factoryProductionService.getFactoryProductionForTurn(
          input.factoryId,
          input.gameTurnId
        );
      }),

    getCompanyProduction: trpc.procedure
      .input(z.object({
        companyId: z.string(),
        gameTurnId: z.string(),
      }))
      .query(async ({ input }) => {
        return ctx.factoryProductionService.getCompanyProductionForTurn(
          input.companyId,
          input.gameTurnId
        );
      }),

    getGameTurnProduction: trpc.procedure
      .input(z.object({
        gameId: z.string(),
        gameTurnId: z.string(),
      }))
      .query(async ({ input }) => {
        return ctx.factoryProductionService.getGameTurnProduction(
          input.gameId,
          input.gameTurnId
        );
      }),

    getCompanyProductionHistory: trpc.procedure
      .input(z.object({
        companyId: z.string(),
        gameId: z.string(),
      }))
      .query(async ({ input }) => {
        return ctx.factoryProductionService.getCompanyProductionHistory(
          input.companyId,
          input.gameId
        );
      }),

    getFactoryProductionSummary: trpc.procedure
      .input(z.object({
        companyId: z.string(),
        gameTurnId: z.string(),
      }))
      .query(async ({ input }) => {
        const productions = await ctx.factoryProductionService.getCompanyProductionForTurn(
          input.companyId,
          input.gameTurnId
        );

        const summary = productions.reduce((acc, prod) => ({
          totalCustomers: acc.totalCustomers + prod.customersServed,
          totalRevenue: acc.totalRevenue + prod.revenue,
          totalCosts: acc.totalCosts + prod.costs,
          totalProfit: acc.totalProfit + prod.profit,
          factoryCount: acc.factoryCount + 1,
        }), {
          totalCustomers: 0,
          totalRevenue: 0,
          totalCosts: 0,
          totalProfit: 0,
          factoryCount: 0,
        });

        return summary;
      }),
  });

