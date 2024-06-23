import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { Prisma, StockLocation, OrderType } from '@prisma/client';
import { PlayerOrderService } from '@server/player-order/player-order.service';

type Context = {
  playerOrdersService: PlayerOrderService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getPlayerOrder: trpc.procedure
      .input(z.object({ where: z.any().optional() }))
      .query(async ({ input }) => {
        const { where } = input;
        const playerOrder = await ctx.playerOrdersService.playerOrder(where);
        if (!playerOrder) {
          throw new Error('Player Order not found');
        }
        return playerOrder;
      }),

    listPlayerOrders: trpc.procedure
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
        return ctx.playerOrdersService.playerOrders({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    createPlayerOrder: trpc.procedure
      .input(
        z.object({
          stockRoundId: z.number(),
          playerId: z.string(),
          companyId: z.string(),
          quantity: z.number().optional(),
          term: z.number().optional(),
          value: z.number().optional(),
          isSell: z.boolean().optional(),
          location: z.nativeEnum(StockLocation),
          orderType: z.nativeEnum(OrderType),
        }),
      )
      .mutation(async ({ input }) => {
        const data: Prisma.PlayerOrderCreateInput = {
          ...input,
          StockRound: { connect: { id: input.stockRoundId } },
          Company: { connect: { id: input.companyId } },
          Player: { connect: { id: input.playerId } },
        };
        const playerOrder = await ctx.playerOrdersService.createPlayerOrder(data);
        return playerOrder;
      }),

    updatePlayerOrder: trpc.procedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            stockRoundId: z.number().optional(),
            playerId: z.string().optional(),
            companyId: z.string().optional(),
            quantity: z.number().optional(),
            term: z.number().optional(),
            value: z.number().optional(),
            isSell: z.boolean().optional(),
            location: z.nativeEnum(StockLocation).optional(),
            orderType: z.nativeEnum(OrderType).optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, data } = input;
        return ctx.playerOrdersService.updatePlayerOrder({ where: { id }, data });
      }),

    deletePlayerOrder: trpc.procedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { id } = input;
        return ctx.playerOrdersService.deletePlayerOrder({ id });
      }),
  });
