import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { Prisma } from '@prisma/client';
import { CapitalGainsService } from '@server/capital-gains/capital-gains.service';

type Context = {
  capitalGainsService: CapitalGainsService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getCapitalGains: trpc.procedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { id } = input;
        const capitalGains = await ctx.capitalGainsService.capitalGains({ id });
        if (!capitalGains) {
          throw new Error('CapitalGains not found');
        }
        return capitalGains;
      }),

    listCapitalGains: trpc.procedure
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
        return ctx.capitalGainsService.capitalGainsList({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    createCapitalGains: trpc.procedure
      .input(
        z.object({
          gameId: z.string(),
          playerId: z.string(),
          capitalGains: z.number(),
        }),
      )
      .mutation(async ({ input }) => {
        const { gameId, playerId, ...rest } = input;
        const data = {
          ...rest,
          Game: { connect: { id: gameId } },
          Player: { connect: { id: playerId } },
        };
        return ctx.capitalGainsService.createCapitalGains(data);
      }),

    createManyCapitalGains: trpc.procedure
      .input(
        z.array(
          z.object({
            gameId: z.string(),
            playerId: z.string(),
            capitalGains: z.number(),
          }),
        ),
      )
      .mutation(async ({ input }) => {
        const data: Prisma.CapitalGainsCreateManyInput[] = input;
        data.forEach((d) => delete d.id);
        return ctx.capitalGainsService.createManyCapitalGains(data);
      }),

    updateCapitalGains: trpc.procedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            gameId: z.string().optional(),
            playerId: z.string().optional(),
            capitalGains: z.number().optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, data } = input;
        return ctx.capitalGainsService.updateCapitalGains({
          where: { id },
          data,
        });
      }),

    deleteCapitalGains: trpc.procedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { id } = input;
        return ctx.capitalGainsService.deleteCapitalGains({ id });
      }),
  });
