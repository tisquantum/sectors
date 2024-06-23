import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { Prisma, StockLocation, OrderType } from '@prisma/client';
import { PlayerOrderService } from '@server/player-order/player-order.service';
import { PusherService } from 'nestjs-pusher';
import {
  EVENT_NEW_PLAYER_ORDER,
  EVENT_NEW_PLAYER_ORDER_PLAYER_ID,
  getGameChannelId,
} from '@server/pusher/pusher.types';
import { PlayersService } from '@server/players/players.service';

type Context = {
  playerOrdersService: PlayerOrderService;
  playerService: PlayersService;
  pusherService: PusherService;
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

    listPlayerOrdersWithCompany: trpc.procedure
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
        return ctx.playerOrdersService.playerOrdersWithCompany({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    listPlayerOrdersConcealed: trpc.procedure
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
        return ctx.playerOrdersService.playerOrdersConcealed({
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
          gameId: z.string(),
          stockRoundId: z.number(),
          phaseId: z.string(),
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
        //remove game id from input
        const {
          gameId,
          stockRoundId,
          companyId,
          playerId,
          phaseId,
          ...playerOrderInput
        } = input;
        const data: Prisma.PlayerOrderCreateInput = {
          ...playerOrderInput,
          StockRound: { connect: { id: stockRoundId } },
          Company: { connect: { id: companyId } },
          Player: { connect: { id: playerId } },
          Phase: { connect: { id: phaseId } },
        };
        let playerOrder;
        try {
          playerOrder = await ctx.playerOrdersService.createPlayerOrder(data);
          //subtract one from related player action counter
          await ctx.playerService.subtractActionCounter(
            playerOrder.playerId,
            playerOrder.orderType,
          );
          //Use for "ready up" and updating the authPlayerState
          ctx.pusherService.trigger(
            getGameChannelId(gameId),
            EVENT_NEW_PLAYER_ORDER_PLAYER_ID,
            {
              playerId: playerOrder.playerId,
            },
          );
        } catch (error) {
          console.error(error);
        }
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
        return ctx.playerOrdersService.updatePlayerOrder({
          where: { id },
          data,
        });
      }),

    deletePlayerOrder: trpc.procedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { id } = input;
        return ctx.playerOrdersService.deletePlayerOrder({ id });
      }),
  });
