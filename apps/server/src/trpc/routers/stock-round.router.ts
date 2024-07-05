import { z } from 'zod';
import { StockRoundService } from '@server/stock-round/stock-round.service';
import { TrpcService } from '../trpc.service';
import { Prisma, StockRound } from '@prisma/client';

type Context = {
  stockRoundService: StockRoundService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getStockRound: trpc.procedure
      .input(z.object({ where: z.any() }))
      .query(async ({ input }) => {
        const { where } = input;
        const stockRound = await ctx.stockRoundService.stockRound(where);
        if (!stockRound) {
          throw new Error('Stock round not found');
        }
        return stockRound;
      }),

    getStockRoundWithPlayerOrders: trpc.procedure
      .input(z.object({ where: z.any() }))
      .query(async ({ input }) => {
        const { where } = input;
        const stockRound =
          await ctx.stockRoundService.stockRoundWithPlayerOrders(where);
        if (!stockRound) {
          throw new Error('Stock round not found');
        }
        return stockRound;
      }),

    listStockRounds: trpc.procedure
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
        return ctx.stockRoundService.stockRounds({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    createStockRound: trpc.procedure
      .input(
        z.object({
          gameId: z.string(),
        }),
      )
      .mutation(async ({ input }) => {
        const data: Prisma.StockRoundCreateInput = {
          ...input,
          Game: { connect: { id: input.gameId } },
        };
        const stockRound = await ctx.stockRoundService.createStockRound(data);
        return stockRound;
      }),

    createManyStockRounds: trpc.procedure
      .input(
        z.array(
          z.object({
            gameId: z.string(),
          }),
        ),
      )
      .mutation(async ({ input }) => {
        const data: Prisma.StockRoundCreateManyInput[] = input.map((round) => ({
          ...round,
          Game: { connect: { id: round.gameId } },
        }));
        const batchPayload =
          await ctx.stockRoundService.createManyStockRounds(data);
        return batchPayload;
      }),

    updateStockRound: trpc.procedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            gameId: z.string().optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, data } = input;
        return ctx.stockRoundService.updateStockRound({
          where: { id },
          data: {
            ...data,
            Game: data.gameId ? { connect: { id: data.gameId } } : undefined,
          },
        });
      }),

    deleteStockRound: trpc.procedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { id } = input;
        return ctx.stockRoundService.deleteStockRound({ id });
      }),
  });
