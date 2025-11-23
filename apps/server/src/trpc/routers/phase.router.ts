import { z } from 'zod';
import { PhaseService } from '@server/phase/phase.service';
import { TrpcService } from '../trpc.service';
import { PhaseName, Prisma } from '@prisma/client';

type Context = {
  phaseService: PhaseService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getPhase: trpc.procedure
      .input(z.object({ where: z.any().optional() }))
      .query(async ({ input }) => {
        const { where } = input;
        const phase = await ctx.phaseService.phase(where);
        if (!phase) {
          throw new Error('Phase not found');
        }
        return phase;
      }),

    listPhases: trpc.procedure
      .input(
        z.object({
          skip: z.number().optional(),
          take: z.number().optional(),
          cursor: z.string().optional(),
          where: z.any().optional(),
          orderBy: z.any().optional(),
        }),
      )
      .query(async ({ input }) => {
        const { skip, take, cursor, where, orderBy } = input;
        return ctx.phaseService.phases({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),
  });
