import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { Prisma } from '@prisma/client';
import { ExecutiveInfluenceVoteRoundService } from '@server/executive-influence-vote-round/executive-influence-vote-round.service';

type Context = {
  executiveInfluenceVoteRoundService: ExecutiveInfluenceVoteRoundService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    // Get a specific ExecutiveInfluenceVoteRound by unique identifier
    getVoteRound: trpc.procedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input }) => {
        const { id } = input;
        const voteRound = await ctx.executiveInfluenceVoteRoundService.getVoteRound({
          id,
        });
        if (!voteRound) {
          throw new Error('Vote round not found');
        }
        return voteRound;
      }),

    // List all ExecutiveInfluenceVoteRounds with optional filtering, pagination, and sorting
    listVoteRounds: trpc.procedure
      .input(
        z.object({
          skip: z.number().optional(),
          take: z.number().optional(),
          cursor: z.string().uuid().optional(),
          where: z.any().optional(),
          orderBy: z.any().optional(),
        }),
      )
      .query(async ({ input }) => {
        const { skip, take, cursor, where, orderBy } = input;
        return ctx.executiveInfluenceVoteRoundService.listVoteRounds({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),
  });
