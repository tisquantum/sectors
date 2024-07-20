import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { InfluenceRoundVotesService } from '@server/influence-round-votes/influence-round-votes.service';

type Context = {
  influenceRoundVotesService: InfluenceRoundVotesService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getInfluenceVote: trpc.procedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { id } = input;
        const influenceVote =
          await ctx.influenceRoundVotesService.getInfluenceVote({ id });
        if (!influenceVote) {
          throw new Error('InfluenceVote not found');
        }
        return influenceVote;
      }),

    listInfluenceVotes: trpc.procedure
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
        return ctx.influenceRoundVotesService.listInfluenceVotes({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    createInfluenceVote: trpc.procedure
      .input(
        z.object({
          influenceRoundId: z.number(),
          playerId: z.string(),
          influence: z.number(),
        }),
      )
      .mutation(async ({ input }) => {
        const { influenceRoundId, playerId, influence } = input;
        const data = {
          influence,
          InfluenceRound: { connect: { id: influenceRoundId } },
          Player: { connect: { id: playerId } },
        };

        return ctx.influenceRoundVotesService.createInfluenceVote(data);
      }),

    createManyInfluenceVotes: trpc.procedure
      .input(
        z.array(
          z.object({
            influenceRoundId: z.number(),
            playerId: z.string(),
            influence: z.number(),
          }),
        ),
      )
      .mutation(async ({ input }) => {
        const data = input.map(({ influenceRoundId, playerId, influence }) => ({
          influenceRoundId,
          playerId,
          influence,
        }));
        return ctx.influenceRoundVotesService.createManyInfluenceVotes(data);
      }),

    updateInfluenceVote: trpc.procedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            influenceRoundId: z.number().optional(),
            playerId: z.string().optional(),
            influence: z.number().optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, data } = input;
        return ctx.influenceRoundVotesService.updateInfluenceVote({
          where: { id },
          data,
        });
      }),

    deleteInfluenceVote: trpc.procedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { id } = input;
        return ctx.influenceRoundVotesService.deleteInfluenceVote({ id });
      }),
  });
