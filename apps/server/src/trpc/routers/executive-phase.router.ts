import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { ExecutivePhaseService } from '@server/executive-phase/executive-phase.service';

type Context = {
  executivePhaseService: ExecutivePhaseService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    // Retrieve a specific ExecutivePhase by unique input
    getExecutivePhase: trpc.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { id } = input;
        const phase = await ctx.executivePhaseService.getExecutivePhase({ id });
        if (!phase) {
          throw new Error('ExecutivePhase not found');
        }
        return phase;
      }),

    // List all ExecutivePhases with optional filtering, pagination, and sorting
    listExecutivePhases: trpc.procedure
      .input(
        z.object({
          skip: z.number().optional(),
          take: z.number().optional(),
          cursor: z.string().optional(),
          where: z.any().optional(),
          orderBy: z.any().optional(),
        })
      )
      .query(async ({ input }) => {
        const { skip, take, cursor, where, orderBy } = input;
        return ctx.executivePhaseService.listExecutivePhases({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    // Retrieve the current phase for a specific game
    getCurrentPhase: trpc.procedure
      .input(z.object({ gameId: z.string() }))
      .query(async ({ input }) => {
        const { gameId } = input;
        const currentPhase = await ctx.executivePhaseService.getCurrentPhase(gameId);
        if (!currentPhase) {
          throw new Error('Current phase not found for the specified game');
        }
        return currentPhase;
      }),
  });
