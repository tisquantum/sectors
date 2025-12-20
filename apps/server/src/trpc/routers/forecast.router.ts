import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { ForecastService } from '../../forecast/forecast.service';
import { PhaseName } from '@prisma/client';
import { checkIsPlayerAction, checkSubmissionTime } from '../trpc.middleware';
import { TrpcService } from '../trpc.service';
import { PlayersService } from '@server/players/players.service';
import { PhaseService } from '@server/phase/phase.service';
import { GamesService } from '@server/games/games.service';
import { GameTurnService } from '@server/game-turn/game-turn.service';

type Context = {
  forecastService: ForecastService;
  playerService: PlayersService;
  phaseService: PhaseService;
  gamesService: GamesService;
  gameTurnService: GameTurnService;
};

export const forecastRouter = (trpc: TrpcService, ctx: Context) =>
  router({
    getQuarters: publicProcedure
      .input(z.object({ gameId: z.string() }))
      .query(async ({ input }) => {
        return ctx.forecastService.getForecastQuarters(input.gameId);
      }),

    getQuartersWithSectorBreakdown: publicProcedure
      .input(z.object({ gameId: z.string() }))
      .query(async ({ input }) => {
        return ctx.forecastService.getForecastQuartersWithSectorBreakdown(input.gameId);
      }),

    getPlayerCommitments: publicProcedure
      .input(
        z.object({
          gameId: z.string(),
          gameTurnId: z.string(),
          playerId: z.string(),
        }),
      )
      .query(async ({ input }) => {
        return ctx.forecastService.getPlayerCommitments(
          input.gameId,
          input.gameTurnId,
          input.playerId,
        );
      }),

    commitShares: publicProcedure
      .input(
        z.object({
          gameId: z.string(),
          playerId: z.string(),
          quarterId: z.string(),
          sectorId: z.string(),
          shareIds: z.array(z.string()),
        }),
      )
      .use(async (opts) => checkIsPlayerAction(opts, ctx.playerService))
      .use(async (opts) =>
        checkSubmissionTime(
          [
            PhaseName.FORECAST_COMMITMENT_START_TURN,
            PhaseName.FORECAST_COMMITMENT_END_TURN,
          ],
          opts,
          ctx.phaseService,
          ctx.gamesService,
        ),
      )
      .mutation(async ({ input, ctx: ctxMiddleware }) => {
        if (!ctxMiddleware.submittingPlayerId) {
          throw new Error('Player ID is required');
        }

        if (input.playerId !== ctxMiddleware.submittingPlayerId) {
          throw new Error('Cannot commit shares for another player');
        }

        // Get current phase and game turn
        const game = await ctx.gamesService.game({ id: input.gameId });
        if (!game || !game.currentPhaseId) {
          throw new Error('Game or current phase not found');
        }

        const phase = await ctx.phaseService.phase({
          id: game.currentPhaseId,
        });
        if (!phase) {
          throw new Error('Phase not found');
        }

        const gameTurn = await ctx.gameTurnService.getCurrentTurn(input.gameId);
        if (!gameTurn) {
          throw new Error('Game turn not found');
        }

        return ctx.forecastService.commitSharesToQuarter({
          gameId: input.gameId,
          gameTurnId: gameTurn.id,
          phaseId: phase.id,
          playerId: input.playerId,
          quarterId: input.quarterId,
          sectorId: input.sectorId,
          shareIds: input.shareIds,
        });
      }),

    initializeQuarters: publicProcedure
      .input(z.object({ gameId: z.string() }))
      .mutation(async ({ input }) => {
        return ctx.forecastService.initializeForecastQuarters(input.gameId);
      }),

    getRankings: publicProcedure
      .input(z.object({ gameId: z.string() }))
      .query(async ({ input }) => {
        return ctx.forecastService.getForecastRankings(input.gameId);
      }),

    getForecastConsumerDistribution: publicProcedure
      .input(z.object({ gameId: z.string() }))
      .query(async ({ input }) => {
        const game = await ctx.gamesService.game({ id: input.gameId });
        if (!game || !game.economyScore) {
          throw new Error('Game not found or economy score not available');
        }
        return ctx.forecastService.getForecastDemandScores(input.gameId, game.economyScore);
      }),
  });
