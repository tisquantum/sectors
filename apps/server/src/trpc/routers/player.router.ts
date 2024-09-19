import { z } from 'zod';
import { PlayersService } from '@server/players/players.service';
import { TrpcService } from '../trpc.service';
import { Prisma, RoundType } from '@prisma/client';

type Context = {
  playersService: PlayersService;
};

// Nested Map: gameId -> Map<playerId, boolean>
const gamePlayerReadyStatus = new Map<string, Map<string, boolean>>();

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getPlayer: trpc.procedure
      .input(z.object({ where: z.any().optional() }))
      .query(async ({ input }) => {
        const { where } = input;
        const player = await ctx.playersService.player(where);
        if (!player) {
          console.error('Player not found getPlayer');
          return null;
        }
        return player;
      }),

    listPlayers: trpc.procedure
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
        return ctx.playersService.players({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),
    playerWithShares: trpc.procedure
      .input(z.object({ where: z.any().optional() }))
      .query(async ({ input }) => {
        const { where } = input;
        const player = await ctx.playersService.playerWithShares(where);
        if (!player) {
          throw new Error('Player not found playerWithShares');
        }
        return player;
      }),
    playersWithShares: trpc.procedure
      .input(z.object({ where: z.any().optional() }))
      .query(async ({ input }) => {
        const { where } = input;
        return ctx.playersService.playersWithShares(where);
      }),

    updatePlayer: trpc.procedure
      .input(
        z.object({
          id: z.string(),
          data: z.object({
            nickname: z.string().optional(),
            cashOnHand: z.number().optional(),
            gameId: z.string(),
            PlayerStock: z.any().optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, data } = input;
        return ctx.playersService.updatePlayer({ where: { id }, data });
      }),

    playerReady: trpc.procedure
      .input(z.object({ playerId: z.string(), gameId: z.string() }))
      .mutation(async ({ input }) => {
        const { playerId, gameId } = input;
        const player = await ctx.playersService.player({ id: playerId });
        if (!player) {
          throw new Error('Player not found playerReady');
        }

        // Mark the player as ready in the specified game
        if (!gamePlayerReadyStatus.has(gameId)) {
          throw new Error('Game not found');
        }

        const gamePlayers = gamePlayerReadyStatus.get(gameId);
        if (!gamePlayers?.has(playerId)) {
          throw new Error('Player not found in the specified game');
        }

        gamePlayers.set(playerId, true);
        return { success: true, message: 'Player marked as ready' };
      }),
  });
