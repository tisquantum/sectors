import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { PhaseName, Prisma, RevenueDistribution } from '@prisma/client';
import { RevenueDistributionVoteService } from '@server/revenue-distribution-vote/revenue-distribution-vote.service';
import { checkIsPlayerAction, checkSubmissionTime } from '../trpc.middleware';
import { PhaseService } from '@server/phase/phase.service';
import { PlayersService } from '@server/players/players.service';

type Context = {
  revenueDistributionVoteService: RevenueDistributionVoteService;
  phaseService: PhaseService;
  playerService: PlayersService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getRevenueDistributionVote: trpc.procedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { id } = input;
        const vote =
          await ctx.revenueDistributionVoteService.revenueDistributionVote({
            id,
          });
        if (!vote) {
          throw new Error('Vote not found');
        }
        return vote;
      }),

    listRevenueDistributionVotes: trpc.procedure
      .input(
        z.object({
          skip: z.number().optional(),
          take: z.number().optional(),
          cursor: z.number().optional(),
          where: z.any().optional(), // Define more specific validation if needed
          orderBy: z.any().optional(), // Define more specific validation if needed
        }),
      )
      .query(async ({ input }) => {
        const { skip, take, cursor, where, orderBy } = input;
        return ctx.revenueDistributionVoteService.revenueDistributionVotes({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    listRevenueDistributionVotesWithRelations: trpc.procedure
      .input(
        z.object({
          skip: z.number().optional(),
          take: z.number().optional(),
          cursor: z.number().optional(),
          where: z.any().optional(), // Define more specific validation if needed
          orderBy: z.any().optional(), // Define more specific validation if needed
          gameId: z.string(),
        }),
      )
      .query(async ({ input }) => {
        if (!input.gameId) {
          throw new Error('Game ID is required');
        }
        const { skip, take, cursor, where, orderBy, gameId } = input;
        //get phase to check if it is OPERATING_PRODUCTION_VOTE
        const phase = await ctx.phaseService.currentPhase(gameId);
        if (!phase) {
          throw new Error('Phase not found');
        }
        if (phase.name === PhaseName.OPERATING_PRODUCTION_VOTE) {
          throw new Error('Cannot retrieve votes during production vote phase');
        }
        return ctx.revenueDistributionVoteService.revenueDistributionVotesWithRelations(
          {
            skip,
            take,
            cursor: cursor ? { id: cursor } : undefined,
            where,
            orderBy,
          },
        );
      }),

    createRevenueDistributionVote: trpc.procedure
      .input(
        z.object({
          operatingRoundId: z.number(),
          productionResultId: z.number(),
          playerId: z.string(),
          companyId: z.string(),
          revenueDistribution: z.nativeEnum(RevenueDistribution),
        }),
      )
      .use(async (opts) => checkIsPlayerAction(opts, ctx.playerService))
      .use(async (opts) => checkSubmissionTime(opts, ctx.phaseService))
      .mutation(async ({ input, ctx: ctxMiddleware }) => {
        const {
          playerId,
          companyId,
          operatingRoundId,
          productionResultId,
          ...rest
        } = input;
        const data: Prisma.RevenueDistributionVoteCreateInput = {
          ...rest,
          OperatingRound: { connect: { id: operatingRoundId } },
          Player: { connect: { id: playerId } },
          Company: { connect: { id: companyId } },
          ProductionResult: { connect: { id: productionResultId } },
          submissionStamp: ctxMiddleware.submissionStamp,
        };
        return ctx.revenueDistributionVoteService.createRevenueDistributionVote(
          data,
        );
      }),

    updateRevenueDistributionVote: trpc.procedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            operatingRoundId: z.number().optional(),
            productionResultId: z.number().optional(),
            playerId: z.string().optional(),
            companyId: z.string().optional(),
            revenueDistribution: z.nativeEnum(RevenueDistribution).optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, data } = input;
        return ctx.revenueDistributionVoteService.updateRevenueDistributionVote(
          { where: { id }, data },
        );
      }),

    deleteRevenueDistributionVote: trpc.procedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { id } = input;
        return ctx.revenueDistributionVoteService.deleteRevenueDistributionVote(
          { id },
        );
      }),
  });
