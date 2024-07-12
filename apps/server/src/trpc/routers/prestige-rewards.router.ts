import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { PrestigeReward, Prisma } from '@prisma/client';
import { PrestigeRewardsService } from '@server/prestige-rewards/prestige-rewards.service';

type Context = {
  prestigeRewardsService: PrestigeRewardsService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getPrestigeReward: trpc.procedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { id } = input;
        const prestigeReward =
          await ctx.prestigeRewardsService.getPrestigeReward({ id });
        if (!prestigeReward) {
          throw new Error('PrestigeReward not found');
        }
        return prestigeReward;
      }),

    listPrestigeRewards: trpc.procedure
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
        return ctx.prestigeRewardsService.listPrestigeRewards({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    createPrestigeReward: trpc.procedure
      .input(
        z.object({
          gameId: z.string(),
          companyId: z.string(),
          gameTurnId: z.string(),
          reward: z.nativeEnum(PrestigeReward),
        }),
      )
      .mutation(async ({ input }) => {
        const { gameId, companyId, gameTurnId, ...rest } = input;
        const data = {
          ...rest,
          Game: { connect: { id: gameId } },
          GameTurn: { connect: { id: gameTurnId } },
          Company: { connect: { id: companyId } },
        };

        return ctx.prestigeRewardsService.createPrestigeReward(data);
      }),

    createManyPrestigeRewards: trpc.procedure
      .input(
        z.array(
          z.object({
            gameId: z.string(),
            companyId: z.string(),
            gameTurnId: z.string(),
            reward: z.nativeEnum(PrestigeReward),
          }),
        ),
      )
      .mutation(async ({ input }) => {
        const data = input.map(({ gameId, companyId, gameTurnId, reward }) => ({
          gameId,
          companyId,
          gameTurnId,
          reward,
        }));
        return ctx.prestigeRewardsService.createManyPrestigeRewards(data);
      }),

    updatePrestigeReward: trpc.procedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            gameId: z.string().optional(),
            companyId: z.string().optional(),
            gameTurnId: z.string().optional(),
            reward: z.nativeEnum(PrestigeReward).optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, data } = input;
        return ctx.prestigeRewardsService.updatePrestigeReward({
          where: { id },
          data,
        });
      }),

    deletePrestigeReward: trpc.procedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { id } = input;
        return ctx.prestigeRewardsService.deletePrestigeReward({ id });
      }),
  });
