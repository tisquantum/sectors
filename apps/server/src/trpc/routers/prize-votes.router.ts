import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { PrizeVotesService } from '@server/prize-votes/prize-votes.service';
import { TRPCError } from '@trpc/server';
import { PlayersService } from '@server/players/players.service';
import { PhaseService } from '@server/phase/phase.service';
import { checkIsPlayerAction, checkIsPlayerActionBasedOnAuth, checkSubmissionTime } from '../trpc.middleware';
import { PusherService } from 'nestjs-pusher';
import { EVENT_NEW_PRIZE_VOTE, getGameChannelId } from '@server/pusher/pusher.types';

type Context = {
  prizeVotesService: PrizeVotesService;
  phaseService: PhaseService;
  playersService: PlayersService;
  pusherService: PusherService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    // Method to create a prize vote
    createPrizeVote: trpc.procedure
      .input(
        z.object({
          gameTurnId: z.string(),
          prizeId: z.string(),
        }),
      )
      .use(async (opts) => checkIsPlayerActionBasedOnAuth(opts, ctx.playersService))
      .use(async (opts) => checkSubmissionTime(opts, ctx.phaseService))
      .mutation(async ({ input, ctx: ctxMiddleware }) => {
        const { gameTurnId, prizeId } = input;
        if (!ctxMiddleware.gameId) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to perform this operation',
          });
        }
        try {
          const playerVote = await ctx.prizeVotesService.createPrizeVote({
            Player: { connect: { id: ctxMiddleware.submittingPlayerId } },
            GameTurn: { connect: { id: gameTurnId } },
            Prize: { connect: { id: prizeId } },
          });
          //pusher
          ctx.pusherService.trigger(
            getGameChannelId(ctxMiddleware.gameId),
            EVENT_NEW_PRIZE_VOTE,
            playerVote,
          );
          return playerVote;
        } catch (error) {
          console.error('Error creating prize vote', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Error creating prize vote',
          });
        }
      }),

    // Method to list concealed results (only counts)
    listConcealedResults: trpc.procedure
      .input(
        z.object({
          gameTurnId: z.string(),
        }),
      )
      .query(async ({ input }) => {
        const { gameTurnId } = input;

        try {
          const votes = await ctx.prizeVotesService.listPrizeVotes({
            where: { gameTurnId },
            orderBy: { createdAt: 'asc' },
          });

          // Group and count votes by prizeId
          const concealedResults = votes.reduce(
            (acc, vote) => {
              acc[vote.prizeId] = (acc[vote.prizeId] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          );

          return concealedResults;
        } catch (error) {
          console.error('Error listing concealed results', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Error listing concealed results',
          });
        }
      }),

    // Method to list revealed results (showing who voted for what)
    listRevealedResults: trpc.procedure
      .input(
        z.object({
          gameTurnId: z.string(),
        }),
      )
      .query(async ({ input }) => {
        const { gameTurnId } = input;

        try {
          return await ctx.prizeVotesService.listPrizeVotes({
            where: { gameTurnId },
            orderBy: { createdAt: 'asc' },
          });
        } catch (error) {
          console.error('Error listing revealed results', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Error listing revealed results',
          });
        }
      }),
  });
