import { z } from 'zod';
import { OperatingRoundVoteService } from '@server/operating-round-vote/operating-round-vote.service';
import { TrpcService } from '../trpc.service';
import { Prisma, OperatingRoundAction, PhaseName } from '@prisma/client';
import { checkIsPlayerAction, checkSubmissionTime } from '../trpc.middleware';
import { PhaseService } from '@server/phase/phase.service';
import { PlayersService } from '@server/players/players.service';
import { TRPCError } from '@trpc/server';
import { GamesService } from '@server/games/games.service';

type Context = {
  operatingRoundVoteService: OperatingRoundVoteService;
  playerService: PlayersService;
  phaseService: PhaseService;
  gamesService: GamesService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getOperatingRoundVote: trpc.procedure
      .input(z.object({ where: z.any() }))
      .query(async ({ input }) => {
        const { where } = input;
        const vote =
          await ctx.operatingRoundVoteService.operatingRoundVote(where);
        if (!vote) {
          throw new Error('Operating round vote not found');
        }
        return vote;
      }),

    listOperatingRoundVotes: trpc.procedure
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
        return ctx.operatingRoundVoteService.operatingRoundVotes({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    createOperatingRoundVote: trpc.procedure
      .input(
        z.object({
          operatingRoundId: z.string(),
          playerId: z.string(),
          companyId: z.string(),
          actionVoted: z.nativeEnum(OperatingRoundAction),
          gameId: z.string(),
        }),
      )
      .use(async (opts) => checkIsPlayerAction(opts, ctx.playerService))
      .use(async (opts) =>
        checkSubmissionTime(
          PhaseName.OPERATING_ACTION_COMPANY_VOTE,
          opts,
          ctx.phaseService,
          ctx.gamesService,
        ),
      )
      .mutation(async ({ input, ctx: ctxMiddleware }) => {
        const { operatingRoundId, playerId, companyId, gameId, ...rest } =
          input;
        //TODO: Remove operating round reference from args
        const data: Prisma.OperatingRoundVoteCreateInput = {
          ...rest,
          OperatingRound: { connect: { id: operatingRoundId } },
          Player: { connect: { id: playerId } },
          Company: { connect: { id: companyId } },
          submissionStamp: ctxMiddleware.submissionStamp,
        };
        try {
          const vote =
            await ctx.operatingRoundVoteService.createOperatingRoundVote(data);
          return vote;
        } catch (error) {
          console.error(error);
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `An error occurred while creating the player order: ${error}`,
          });
        }
      }),

    createManyOperatingRoundVotes: trpc.procedure
      .input(
        z.array(
          z.object({
            operatingRoundId: z.string(),
            playerId: z.string(),
            companyId: z.string(),
            actionVoted: z.nativeEnum(OperatingRoundAction),
          }),
        ),
      )
      .mutation(async ({ input }) => {
        const data: Prisma.OperatingRoundVoteCreateManyInput[] = input.map(
          (vote) => ({
            ...vote,
            OperatingRound: { connect: { id: vote.operatingRoundId } },
            Player: { connect: { id: vote.playerId } },
            Company: { connect: { id: vote.companyId } },
          }),
        );
        const batchPayload =
          await ctx.operatingRoundVoteService.createManyOperatingRoundVotes(
            data,
          );
        return batchPayload;
      }),

    updateOperatingRoundVote: trpc.procedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            operatingRoundId: z.number().optional(),
            playerId: z.string().optional(),
            companyId: z.string().optional(),
            actionVoted: z.nativeEnum(OperatingRoundAction).optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, data } = input;
        return ctx.operatingRoundVoteService.updateOperatingRoundVote({
          where: { id },
          data,
        });
      }),

    deleteOperatingRoundVote: trpc.procedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { id } = input;
        return ctx.operatingRoundVoteService.deleteOperatingRoundVote({ id });
      }),
  });
