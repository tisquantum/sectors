import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { Prisma, PhaseName } from '@prisma/client';
import { PlayerHeadlineService } from '@server/player-headline/player-headline.service';
import { PlayersService } from '@server/players/players.service';
import { PusherService } from 'nestjs-pusher';
import { GameLogService } from '@server/game-log/game-log.service';
import { PhaseService } from '@server/phase/phase.service';
import { GameManagementService } from '@server/game-management/game-management.service';
import { GamesService } from '@server/games/games.service';
import { TRPCError } from '@trpc/server';
import { checkIsPlayerAction, checkSubmissionTime } from '../trpc.middleware';
import {
  getGameChannelId,
  EVENT_NEW_PLAYER_HEADLINE,
} from '@server/pusher/pusher.types';

type Context = {
  playerHeadlineService: PlayerHeadlineService;
  playerService: PlayersService;
  pusherService: PusherService;
  phaseService: PhaseService;
  gamesService: GamesService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    // Get a specific PlayerHeadline
    getPlayerHeadline: trpc.procedure
      .input(z.object({ where: z.any() }))
      .query(async ({ input }) => {
        const { where } = input;
        const playerHeadline =
          await ctx.playerHeadlineService.getPlayerHeadline(where);
        if (!playerHeadline) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'PlayerHeadline not found',
          });
        }
        return playerHeadline;
      }),

    // List PlayerHeadlines
    listPlayerHeadlines: trpc.procedure
      .input(
        z.object({
          skip: z.number().optional(),
          take: z.number().optional(),
          cursor: z.any().optional(),
          where: z.any().optional(),
          orderBy: z.any().optional(),
        }),
      )
      .query(async ({ input }) => {
        const { skip, take, cursor, where, orderBy } = input;
        return ctx.playerHeadlineService.listPlayerHeadlines({
          skip,
          take,
          cursor,
          where,
          orderBy,
        });
      }),

    // Create a new PlayerHeadline
    createPlayerHeadline: trpc.procedure
      .input(
        z.object({
          playerId: z.string(),
          headlineId: z.string(),
          gameId: z.string(),
          gameTurnId: z.string(),
        }),
      )
      .use(async (opts) => checkIsPlayerAction(opts, ctx.playerService))
      .use(async (opts) =>
        checkSubmissionTime(opts, ctx.phaseService, ctx.gamesService),
      )
      .mutation(async ({ input, ctx: ctxMiddleware }) => {
        const { playerId, headlineId, gameId, gameTurnId } = input;

        // Ensure gameId is provided or available in context
        const gameIdToUse = gameId || ctxMiddleware.gameId;
        if (!gameIdToUse) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Game ID was not found for this player.',
          });
        }

        const data: Prisma.PlayerHeadlineCreateInput = {
          player: { connect: { id: playerId } },
          headline: { connect: { id: headlineId } },
          game: { connect: { id: gameIdToUse } },
          gameTurn: { connect: { id: gameTurnId } },
        };

        try {
          const playerHeadline =
            await ctx.playerHeadlineService.createPlayerHeadline(data);

          // Notify via Pusher
          ctx.pusherService.trigger(
            getGameChannelId(gameIdToUse),
            EVENT_NEW_PLAYER_HEADLINE,
            {
              playerId,
              headlineId,
            },
          );

          return playerHeadline;
        } catch (error) {
          console.error(error);
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `An error occurred while creating the player headline: ${error}`,
          });
        }
      }),
  });
