import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { InsolvencyContributionService } from '@server/insolvency-contribution/insolvency-contribution.service';
import { Prisma } from '@prisma/client';
import { checkIsPlayerAction, checkSubmissionTime } from '../trpc.middleware';
import { PlayersService } from '@server/players/players.service';
import { PhaseService } from '@server/phase/phase.service';
import { TRPCError } from '@trpc/server';
import { PusherService } from 'nestjs-pusher';
import {
  EVENT_NEW_INVOLVENCY_CONTRIBUTION,
  getGameChannelId,
} from '@server/pusher/pusher.types';

type Context = {
  insolvencyContributionService: InsolvencyContributionService;
  playerService: PlayersService;
  phaseService: PhaseService;
  pusherService: PusherService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getInsolvencyContribution: trpc.procedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { id } = input;
        const insolvencyContribution =
          await ctx.insolvencyContributionService.getInsolvencyContribution({
            id,
          });
        if (!insolvencyContribution) {
          throw new Error('InsolvencyContribution not found');
        }
        return insolvencyContribution;
      }),

    listInsolvencyContributions: trpc.procedure
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
        return ctx.insolvencyContributionService.listInsolvencyContributions({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    createInsolvencyContribution: trpc.procedure
      .input(
        z.object({
          gameId: z.string(),
          playerId: z.string(),
          companyId: z.string(),
          gameTurnId: z.string(),
          cashContribution: z.number(),
          shareContribution: z.number(),
        }),
      )
      .use(async (opts) => checkIsPlayerAction(opts, ctx.playerService))
      .use(async (opts) => checkSubmissionTime(opts, ctx.phaseService))
      .mutation(async ({ input, ctx: ctxMiddleware }) => {
        if (!ctxMiddleware.gameId) {
          //throw
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Game ID was not found for this player.',
          });
        }
        const { playerId, companyId, gameTurnId, ...rest } = input;
        const data: Prisma.InsolvencyContributionCreateInput = {
          ...rest,
          Game: { connect: { id: ctxMiddleware.gameId } },
          GameTurn: { connect: { id: gameTurnId } },
          Company: { connect: { id: companyId } },
          Player: { connect: { id: playerId } },
        };

        const insolvencyContribution =
          await ctx.insolvencyContributionService.createInsolvencyContribution(
            data,
          );
        //pusher service
        ctx.pusherService.trigger(
          getGameChannelId(ctxMiddleware.gameId),
          EVENT_NEW_INVOLVENCY_CONTRIBUTION,
          {
            insolvencyContribution,
          },
        );
        return insolvencyContribution;
      }),

    createManyInsolvencyContributions: trpc.procedure
      .input(
        z.array(
          z.object({
            gameId: z.string(),
            playerId: z.string(),
            companyId: z.string(),
            gameTurnId: z.string(),
            cashContribution: z.number(),
            shareContribution: z.number(),
          }),
        ),
      )
      .mutation(async ({ input }) => {
        const data = input.map(
          ({ gameId, playerId, companyId, gameTurnId, ...rest }) => ({
            ...rest,
            gameId,
            playerId,
            companyId,
            gameTurnId,
          }),
        );
        return ctx.insolvencyContributionService.createManyInsolvencyContributions(
          data,
        );
      }),

    updateInsolvencyContribution: trpc.procedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            gameId: z.string().optional(),
            playerId: z.string().optional(),
            companyId: z.string().optional(),
            gameTurnId: z.string().optional(),
            cashContribution: z.number().optional(),
            shareContribution: z.number().optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, data } = input;
        return ctx.insolvencyContributionService.updateInsolvencyContribution({
          where: { id },
          data,
        });
      }),

    deleteInsolvencyContribution: trpc.procedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { id } = input;
        return ctx.insolvencyContributionService.deleteInsolvencyContribution({
          id,
        });
      }),
  });
