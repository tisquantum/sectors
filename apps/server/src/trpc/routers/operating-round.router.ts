import { z } from 'zod';
import { OperatingRoundService } from '@server/operating-round/operating-round.service';
import { TrpcService } from '../trpc.service';
import { Prisma, OperatingRound } from '@prisma/client';

type Context = {
  operatingRoundService: OperatingRoundService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getOperatingRound: trpc.procedure
      .input(z.object({ where: z.any() }))
      .query(async ({ input }) => {
        const { where } = input;
        const operatingRound =
          await ctx.operatingRoundService.operatingRound(where);
        if (!operatingRound) {
          throw new Error('Operating round not found');
        }
        return operatingRound;
      }),

    getOperatingRoundWithProductionResults: trpc.procedure
      .input(z.object({ where: z.any() }))
      .query(async ({ input }) => {
        const { where } = input;
        const operatingRound =
          await ctx.operatingRoundService.operatingRoundWithProductionResults(
            where,
          );
        if (!operatingRound) {
          throw new Error('Operating round not found');
        }
        return operatingRound;
      }),

    listOperatingRounds: trpc.procedure
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
        return ctx.operatingRoundService.operatingRounds({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    createOperatingRound: trpc.procedure
      .input(
        z.object({
          gameId: z.string(),
          roundNumber: z.number(),
          startTime: z.date().optional(),
          endTime: z.date().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const data: Prisma.OperatingRoundCreateInput = {
          ...input,
          Game: { connect: { id: input.gameId } },
        };
        const operatingRound =
          await ctx.operatingRoundService.createOperatingRound(data);
        return operatingRound;
      }),

    createManyOperatingRounds: trpc.procedure
      .input(
        z.array(
          z.object({
            gameId: z.string(),
            roundNumber: z.number(),
            phase: z.string().optional(),
            startTime: z.date().optional(),
            endTime: z.date().optional(),
          }),
        ),
      )
      .mutation(async ({ input }) => {
        const data: Prisma.OperatingRoundCreateManyInput[] = input.map(
          (round) => ({
            ...round,
            Game: { connect: { id: round.gameId } },
          }),
        );
        const batchPayload =
          await ctx.operatingRoundService.createManyOperatingRounds(data);
        return batchPayload;
      }),

    updateOperatingRound: trpc.procedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            roundNumber: z.number().optional(),
            startTime: z.date().optional(),
            endTime: z.date().optional(),
            gameId: z.string().optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, data } = input;
        return ctx.operatingRoundService.updateOperatingRound({
          where: { id },
          data: { ...data, Game: { connect: { id: data.gameId } } },
        });
      }),

    deleteOperatingRound: trpc.procedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { id } = input;
        return ctx.operatingRoundService.deleteOperatingRound({ id });
      }),
  });
