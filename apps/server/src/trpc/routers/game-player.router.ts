import { z } from 'zod';
import { GamePlayerService } from '@server/game-player/game-player.service';
import { TrpcService } from '../trpc.service';
import { Prisma } from '@prisma/client';
import { PusherService } from 'nestjs-pusher';
import {
  EVENT_GAME_JOINED,
  EVENT_GAME_LEFT,
  getGameChannelId,
} from '@server/pusher/pusher.types';

type Context = {
  gamePlayersService: GamePlayerService;
  pusherService: PusherService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getGamePlayer: trpc.procedure
      .input(z.object({ gameId: z.string(), playerId: z.string() }))
      .query(async ({ input }) => {
        const { gameId, playerId } = input;
        const gamePlayer = await ctx.gamePlayersService.gamePlayer({
          gameId_playerId: { gameId, playerId },
        });
        if (!gamePlayer) {
          throw new Error('GamePlayer not found');
        }
        return gamePlayer;
      }),

    listGamePlayers: trpc.procedure
      .input(
        z.object({
          skip: z.number().optional(),
          take: z.number().optional(),
          cursor: z
            .object({
              gameId: z.string(),
              playerId: z.string(),
            })
            .optional(),
          where: z.any().optional(),
          orderBy: z.any().optional(),
        }),
      )
      .query(async ({ input }) => {
        const { skip, take, cursor, where, orderBy } = input;
        return ctx.gamePlayersService.gamePlayers({
          skip,
          take,
          cursor: cursor ? { gameId_playerId: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    joinGame: trpc.procedure
      .input(
        z.object({
          gameId: z.string(),
          playerId: z.string(),
        }),
      )
      .mutation(async ({ input }) => {
        const { gameId, playerId } = input;

        try {
          const gamePlayer = await ctx.gamePlayersService.createGamePlayer({
            Game: { connect: { id: gameId } },
            Player: { connect: { id: playerId } },
          });

          // Pusher logic
          ctx.pusherService
            .trigger(
              getGameChannelId(gameId),
              EVENT_GAME_JOINED,
              gamePlayer.playerId,
            )
            .catch((error) => {
              console.error('Error triggering pusher event:', error);
            });

          return {
            success: true,
            message: 'Player successfully added to the game',
            data: gamePlayer,
          };
        } catch (error) {
          // Handle specific error if player is already in the game
          if (error.code === 'P2002') {
            // Prisma unique constraint violation error code
            return {
              success: false,
              message: 'Player is already in the game',
            };
          }

          // Handle other errors
          return {
            success: false,
            message: 'An unexpected error occurred',
            error: error.message,
          };
        }
      }),

    updateGamePlayer: trpc.procedure
      .input(
        z.object({
          gameId: z.string(),
          playerId: z.string(),
          data: z.object({
            newGameId: z.string().optional(),
            newPlayerId: z.string().optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const { gameId, playerId, data } = input;
        const updateData: Prisma.GamePlayerUpdateInput = {};

        if (data.newGameId) {
          updateData.Game = {
            connect: { id: data.newGameId },
          };
        }

        if (data.newPlayerId) {
          updateData.Player = {
            connect: { id: data.newPlayerId },
          };
        }

        return ctx.gamePlayersService.updateGamePlayer({
          where: { gameId_playerId: { gameId, playerId } },
          data: updateData,
        });
      }),

    leaveGame: trpc.procedure
      .input(z.object({ gameId: z.string(), playerId: z.string() }))
      .mutation(async ({ input }) => {
        const { gameId, playerId } = input;

        try {
          const gamePlayer = await ctx.gamePlayersService.deleteGamePlayer({
            gameId_playerId: { gameId, playerId },
          });

          // Pusher logic
          ctx.pusherService.trigger(getGameChannelId(gameId), EVENT_GAME_LEFT, {
            gameId,
            playerId,
          });

          return {
            success: true,
            message: 'Player successfully removed from the game',
            data: gamePlayer,
          };
        } catch (error) {
          // Handle specific errors if needed
          if (error.code === 'P2025') {
            // Prisma record not found error code
            return {
              success: false,
              message: 'Player is not in the game',
            };
          }

          // Handle other errors
          return {
            success: false,
            message: 'An unexpected error occurred',
            error: error.message,
          };
        }
      }),
  });
