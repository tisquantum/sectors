import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { Prisma } from '@prisma/client';
import { GameLogService } from '@server/game-log/game-log.service';

type Context = {
  gameLogService: GameLogService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getGameLog: trpc.procedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { id } = input;
        const gameLog = await ctx.gameLogService.gameLog({ id });
        if (!gameLog) {
          throw new Error('GameLog not found');
        }
        return gameLog;
      }),

    listGameLogs: trpc.procedure
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
        return ctx.gameLogService.gameLogs({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    createGameLog: trpc.procedure
      .input(
        z.object({
          gameId: z.string(),
          content: z.string(),
        }),
      )
      .mutation(async ({ input }) => {
        const { gameId, ...rest } = input;
        const createGameLogData = {
          ...rest,
          game: { connect: { id: gameId } },
        };
        return ctx.gameLogService.createGameLog(createGameLogData);
      }),

    createManyGameLogs: trpc.procedure
      .input(z.array(z.any()))
      .mutation(async ({ input }) => {
        const data: Prisma.GameLogCreateManyInput[] = input;
        data.forEach((d) => delete d.id);
        return ctx.gameLogService.createManyGameLogs(data);
      }),

    updateGameLog: trpc.procedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            gameId: z.string().optional(),
            content: z.string().optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, data } = input;
        return ctx.gameLogService.updateGameLog({ where: { id }, data });
      }),

    deleteGameLog: trpc.procedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { id } = input;
        return ctx.gameLogService.deleteGameLog({ id });
      }),
  });
