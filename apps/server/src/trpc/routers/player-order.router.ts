import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import {
  Prisma,
  ShareLocation,
  OrderType,
  OrderStatus,
  PhaseName,
} from '@prisma/client';
import { PlayerOrderService } from '@server/player-order/player-order.service';
import { PusherService } from 'nestjs-pusher';
import {
  EVENT_NEW_PLAYER_ORDER,
  EVENT_NEW_PLAYER_ORDER_PLAYER_ID,
  getGameChannelId,
} from '@server/pusher/pusher.types';
import { PlayersService } from '@server/players/players.service';
import { TRPCError } from '@trpc/server';
import { GameLogService } from '@server/game-log/game-log.service';
import { checkIsPlayerAction, checkSubmissionTime } from '../trpc.middleware';
import { PhaseService } from '@server/phase/phase.service';

type Context = {
  playerOrdersService: PlayerOrderService;
  playerService: PlayersService;
  pusherService: PusherService;
  phaseService: PhaseService;
  gameLogService: GameLogService;
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
    listPlayerOrdersWithPlayerCompany: trpc.procedure
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
        return ctx.playerOrdersService.playerOrdersWithPlayerCompany({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),
    listPlayerOrdersWithPlayerRevealed: trpc.procedure
      .input(
        z.object({
          skip: z.number().optional(),
          take: z.number().optional(),
          cursor: z.number().optional(),
          where: z.any().optional(),
          orderBy: z.any().optional(),
          gameId: z.string(),
        }),
      )
      .query(async ({ input }) => {
        if (!input.gameId) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Game ID is required',
          });
        }
        const { skip, take, cursor, where, orderBy, gameId } = input;
        //get phase
        const phase = await ctx.phaseService.currentPhase(gameId);
        if (!phase) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Phase not found',
          });
        }
        if (
          phase.name == PhaseName.STOCK_ACTION_ORDER ||
          phase.name == PhaseName.STOCK_ACTION_RESULT
        ) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message:
              'Cannot view orders during stock action order or result phase',
          });
        }
        return ctx.playerOrdersService.playerOrdersWithPlayerRevealed({
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

    listPlayerOrdersAllRelations: trpc.procedure
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
        return ctx.playerOrdersService.playerOrdersAllRelations({
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
          sectorId: z.string(),
          quantity: z.number().optional(),
          value: z.number().optional(),
          isSell: z.boolean().optional(),
          location: z.nativeEnum(ShareLocation),
          orderType: z.nativeEnum(OrderType),
          contractId: z.number().optional(),
        }),
      )
      .use(async (opts) => checkIsPlayerAction(opts, ctx.playerService))
      .use(async (opts) => checkSubmissionTime(opts, ctx.phaseService))
      .mutation(async ({ input, ctx: ctxMiddleware }) => {
        //remove game id from input
        const {
          gameId,
          stockRoundId,
          companyId,
          playerId,
          phaseId,
          sectorId,
          contractId,
          ...playerOrderInput
        } = input;
        console.log('playerOrderInput', playerOrderInput);
        const data: Prisma.PlayerOrderCreateInput = {
          ...playerOrderInput,
          orderStatus: OrderStatus.PENDING,
          Game: { connect: { id: gameId } },
          StockRound: { connect: { id: stockRoundId } },
          Company: { connect: { id: companyId } },
          Player: { connect: { id: playerId } },
          Phase: { connect: { id: phaseId } },
          Sector: { connect: { id: sectorId } },
          ...(contractId && {
            OptionContract: { connect: { id: contractId } },
          }),
          submissionStamp: ctxMiddleware.submissionStamp,
        };
        let playerOrder;
        try {
          playerOrder = await ctx.playerOrdersService.createPlayerOrder(data);
          //subtract one from related player action counter
          await ctx.playerService.subtractActionCounter(
            playerOrder.playerId,
            playerOrder.orderType,
          );
          //get player
          const player = await ctx.playerService.player({ id: playerId });
          await ctx.gameLogService.createGameLog({
            game: { connect: { id: gameId } },
            content: `Player ${player?.nickname} created an order.`,
          });
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
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An error occurred while creating the player order',
          });
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
            location: z.nativeEnum(ShareLocation).optional(),
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
