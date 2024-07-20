import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { InfluenceRoundService } from '@server/influence-round/influence-round.service';

type Context = {
  influenceRoundService: InfluenceRoundService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getInfluenceRound: trpc.procedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { id } = input;
        const influenceRound =
          await ctx.influenceRoundService.getInfluenceRound({ id });
        if (!influenceRound) {
          throw new Error('InfluenceRound not found');
        }
        return influenceRound;
      }),

    listInfluenceRounds: trpc.procedure
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
        return ctx.influenceRoundService.listInfluenceRounds({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    createInfluenceRound: trpc.procedure
      .input(
        z.object({
          gameId: z.string(),
          roundStep: z.number(),
          gameTurnId: z.string(),
        }),
      )
      .mutation(async ({ input }) => {
        const { gameId, roundStep, gameTurnId } = input;
        const data = {
          roundStep,
          Game: { connect: { id: gameId } },
          GameTurn: { connect: { id: gameTurnId } },
        };

        return ctx.influenceRoundService.createInfluenceRound(data);
      }),

    createManyInfluenceRounds: trpc.procedure
      .input(
        z.array(
          z.object({
            gameId: z.string(),
            roundStep: z.number(),
            gameTurnId: z.string(),
          }),
        ),
      )
      .mutation(async ({ input }) => {
        const data = input.map(({ gameId, roundStep, gameTurnId }) => ({
          gameId,
          roundStep,
          gameTurnId,
        }));
        return ctx.influenceRoundService.createManyInfluenceRounds(data);
      }),

    updateInfluenceRound: trpc.procedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            gameId: z.string().optional(),
            roundStep: z.number().optional(),
            gameTurnId: z.string().optional(),
            isRevealed: z.boolean().optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, data } = input;
        return ctx.influenceRoundService.updateInfluenceRound({
          where: { id },
          data,
        });
      }),

    deleteInfluenceRound: trpc.procedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { id } = input;
        return ctx.influenceRoundService.deleteInfluenceRound({ id });
      }),
  });
