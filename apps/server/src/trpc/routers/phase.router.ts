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

    createPhase: trpc.procedure
      .input(
        z.object({
          name: z.nativeEnum(PhaseName),
          gameId: z.string(),
          gameTurnId: z.string(),
          phaseTime: z.number(),
          stockRoundId: z.number().optional(),
          operatingRoundId: z.number().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const data: Prisma.PhaseCreateInput = {
          ...input,
          Game: { connect: { id: input.gameId } },
          GameTurn: { connect: { id: input.gameTurnId } },
          StockRound: input.stockRoundId
            ? { connect: { id: input.stockRoundId } }
            : undefined,
          OperatingRound: input.operatingRoundId
            ? { connect: { id: input.operatingRoundId } }
            : undefined,
        };
        const phase = await ctx.phaseService.createPhase(data);
        return phase;
      }),

    updatePhase: trpc.procedure
      .input(
        z.object({
          id: z.string(),
          data: z.object({
            name: z.nativeEnum(PhaseName).optional(),
            gameId: z.string().optional(),
            phaseTime: z.number().optional(),
            stockRoundId: z.number().optional(),
            operatingRoundId: z.number().optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, data } = input;
        return ctx.phaseService.updatePhase({ where: { id }, data });
      }),

    deletePhase: trpc.procedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const { id } = input;
        return ctx.phaseService.deletePhase({ id });
      }),
  });
