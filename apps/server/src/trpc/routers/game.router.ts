import { PusherService } from 'nestjs-pusher';
import { z } from 'zod';
import { GamesService } from '@server/games/games.service';
import { TrpcService } from '../trpc.service';
import {
  DistributionStrategy,
  Game,
  PhaseName,
  RoundType,
  GameStatus,
  OperatingRoundAction,
} from '@prisma/client';
import { GameManagementService } from '@server/game-management/game-management.service';
import {
  EVENT_GAME_STARTED,
  EVENT_PLAYER_READINESS_CHANGED,
  getGameChannelId,
  getRoomChannelId,
} from '@server/pusher/pusher.types';
import { PlayersService } from '@server/players/players.service';
import { PhaseService } from '@server/phase/phase.service';
import { checkIsPlayerAction, checkSubmissionTime } from '../trpc.middleware';

type Context = {
  gamesService: GamesService;
  gameManagementService: GameManagementService;
  pusherService: PusherService;
  playerService: PlayersService;
  phaseService: PhaseService;
};

const prizeDistributionInputSchema = z.object({
  playerId: z.string(),
  distributionData: z.array(
    z.union([
      z.object({
        prizetype: z.literal('cash'),
        playerId: z.string(),
        amount: z.number(),
      }),
      z.object({
        prizetype: z.literal('prestige'),
        companyId: z.string(),
        amount: z.number(),
      }),
      z.object({
        prizetype: z.literal('passive'),
        companyId: z.string(),
        effectName: z.nativeEnum(OperatingRoundAction),
      }),
    ]),
  ),
});

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getGame: trpc.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { id } = input;
        const game = await ctx.gamesService.game({ id });
        if (!game) {
          throw new Error('Game not found');
        }
        return game;
      }),

    listGames: trpc.procedure
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
        return ctx.gamesService.games({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    startGame: trpc.procedure
      .input(
        z.object({
          currentActivePlayer: z.string().nullable().optional(),
          bankPoolNumber: z.number(),
          consumerPoolNumber: z.number(),
          roomId: z.number(),
          roomName: z.string(),
          startingCashOnHand: z.number(),
          distributionStrategy: z.nativeEnum(DistributionStrategy),
          gameMaxTurns: z.number(),
          playerOrdersConcealed: z.boolean(),
          players: z.any().optional(),
          companies: z.any().optional(),
          Player: z.any().optional(),
          Company: z.any().optional(),
          StockRound: z.any().optional(),
          OperatingRound: z.any().optional(),
          ResearchDeck: z.any().optional(),
          Room: z.any().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        let game: Game;
        try {
          game = await ctx.gameManagementService.startGame({
            roomId: input.roomId,
            roomName: input.roomName,
            startingCashOnHand: input.startingCashOnHand,
            consumerPoolNumber: input.consumerPoolNumber,
            bankPoolNumber: input.bankPoolNumber,
            distributionStrategy: input.distributionStrategy,
            gameMaxTurns: input.gameMaxTurns,
            playerOrdersConcealed: input.playerOrdersConcealed,
          });
        } catch (error) {
          return {
            success: false,
            message: 'Error adding players to game',
            data: error,
          };
        }

        // Notify all users in the room that the game has started
        ctx.pusherService.trigger(
          getRoomChannelId(input.roomId),
          EVENT_GAME_STARTED,
          {
            gameId: game.id,
          },
        );

        return {
          success: true,
          message: 'Game started successfully',
        };
      }),

    updateGame: trpc.procedure
      .input(
        z.object({
          id: z.string(),
          data: z.object({
            name: z.string().optional(),
            currentTurn: z.string().optional(),
            currentOrSubRound: z.number().optional(),
            currentRound: z.nativeEnum(RoundType),
            currentActivePlayer: z.string().nullable().optional(),
            bankPoolNumber: z.number().optional(),
            consumerPoolNumber: z.number().optional(),
            gameStatus: z.nativeEnum(GameStatus).optional(),
            players: z.any().optional(),
            companies: z.any().optional(),
            Player: z.any().optional(),
            Company: z.any().optional(),
            StockRound: z.any().optional(),
            OperatingRound: z.any().optional(),
            ResearchDeck: z.any().optional(),
            Room: z.any().optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, data } = input;
        return ctx.gamesService.updateGame({ where: { id }, data });
      }),

    deleteGame: trpc.procedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const { id } = input;
        return ctx.gamesService.deleteGame({ id });
      }),

    getPlayersWithShares: trpc.procedure
      .input(z.object({ gameId: z.string() }))
      .query(async ({ input }) => {
        const { gameId } = input;
        return ctx.gameManagementService.getPlayersWithShares(gameId);
      }),

    getGameState: trpc.procedure
      .input(z.object({ gameId: z.string() }))
      .query(async ({ input }) => {
        const { gameId } = input;
        return ctx.gamesService.getGameState(gameId);
      }),

    forceNextPhase: trpc.procedure
      .input(
        z.object({
          gameId: z.string(),
          phaseName: z.nativeEnum(PhaseName),
          roundType: z.nativeEnum(RoundType),
          stockRoundId: z.number().optional(),
          operatingRoundId: z.number().optional(),
          influenceRoundId: z.number().optional(),
          companyId: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const {
          gameId,
          phaseName,
          roundType,
          stockRoundId,
          operatingRoundId,
          influenceRoundId,
          companyId,
        } = input;
        return ctx.gameManagementService.determineIfNewRoundAndStartPhase({
          gameId,
          phaseName,
          roundType,
          stockRoundId,
          operatingRoundId,
          influenceRoundId,
          companyId,
        });
      }),
    retryPhase: trpc.procedure
      .input(z.object({ gameId: z.string() }))
      .mutation(async ({ input }) => {
        const { gameId } = input;
        return ctx.gameManagementService.retryPhase(gameId);
      }),
    allCompanyActionsOperatingRoundResolved: trpc.procedure
      .input(z.object({ gameId: z.string() }))
      .query(async ({ input }) => {
        const { gameId } = input;
        return ctx.gameManagementService.haveAllActiveCompaniesActionsResolved(
          gameId,
        );
      }),
    doesNextPhaseNeedToBePlayed: trpc.procedure
      .input(
        z.object({
          phaseName: z.nativeEnum(PhaseName),
          currentPhase: z.object({
            name: z.nativeEnum(PhaseName),
            id: z.string(),
            gameId: z.string(),
            gameTurnId: z.string(),
            stockRoundId: z.number().nullable(),
            operatingRoundId: z.number().nullable(),
            influenceRoundId: z.number().nullable(),
            companyId: z.string().nullable(),
            phaseTime: z.number(),
            createdAt: z.date(),
            updatedAt: z.date(),
          }),
        }),
      )
      .query(async ({ input }) => {
        const { phaseName, currentPhase } = input;
        return ctx.gameManagementService.doesNextPhaseNeedToBePlayed(
          phaseName,
          currentPhase,
        );
      }),

    coverShort: trpc.procedure
      .input(z.object({ shortId: z.number(), gameId: z.string() }))
      .use(async (opts) => checkIsPlayerAction(opts, ctx.playerService))
      .use(async (opts) => checkSubmissionTime(opts, ctx.phaseService))
      .mutation(async ({ input }) => {
        try {
          console.log('input short id', input);
          ctx.gameManagementService.coverShortOrder(input.shortId);
        } catch (error) {
          throw new Error('Error covering short order');
        }
      }),
    pauseGame: trpc.procedure
      .input(z.object({ gameId: z.string() }))
      .mutation(async ({ input }) => {
        return ctx.gameManagementService.pauseGame(input.gameId);
      }),
    resumeGame: trpc.procedure
      .input(z.object({ gameId: z.string() }))
      .mutation(async ({ input }) => {
        return ctx.gameManagementService.resumeGame(input.gameId);
      }),
    prizeDistribution: trpc.procedure
      .input(prizeDistributionInputSchema)
      .use(async (opts) => checkIsPlayerAction(opts, ctx.playerService))
      .use(async (opts) => checkSubmissionTime(opts, ctx.phaseService))
      .mutation(async ({ input, ctx: ctxMiddleware }) => {
        const { distributionData } = input;
        if (!distributionData) {
          throw new Error('Distribution data is required');
        }
        if (!ctxMiddleware.submittingPlayerId) {
          throw new Error('Player ID is required');
        }
        let prizes;
        try {
          prizes =
            await ctx.gameManagementService.getPrizesCurrentTurnForPlayer(
              ctxMiddleware.submittingPlayerId,
            );
        } catch (error) {
          throw new Error('Error getting prizes');
        }
        if (!prizes) {
          throw new Error('No prizes found for this player.');
        }
        // Loop through the distributionData and handle each prize type
        for (const distribution of distributionData) {
          switch (distribution.prizetype) {
            case 'cash':
              // Handle cash distribution
              await ctx.gameManagementService.distributeCash({
                playerId: distribution.playerId,
                amount: distribution.amount,
                prize: prizes[0], //this assumption is based on the fact that we only have one prize per turn
              });
              break;

            case 'prestige':
              // Handle prestige distribution
              await ctx.gameManagementService.distributePrestige({
                companyId: distribution.companyId,
                amount: distribution.amount,
                prize: prizes[0],
              });
              break;

            case 'passive':
              // Handle passive effect distribution
              await ctx.gameManagementService.applyPassiveEffect({
                companyId: distribution.companyId,
                effectName: distribution.effectName,
                prize: prizes[0],
              });
              break;

            default:
              throw new Error('Unknown prize type');
          }
        }

        return { success: true };
      }),

    setPlayerReadiness: trpc.procedure
      .input(
        z.object({
          gameId: z.string(),
          playerId: z.string(),
          isReady: z.boolean(),
        }),
      )
      .mutation(({ input }) => {
        const { gameId, playerId, isReady } = input;

        // Delegate the responsibility to GameManagementService
        ctx.gameManagementService.setPlayerReadiness(gameId, playerId, isReady);
        ctx.pusherService.trigger(
          getGameChannelId(gameId),
          EVENT_PLAYER_READINESS_CHANGED,
          {
            playerId,
            isReady,
          },
        );
        return { success: true };
      }),

    listPlayerReadiness: trpc.procedure
      .input(z.object({ gameId: z.string() }))
      .query(({ input }) => {
        const { gameId } = input;

        // Delegate the responsibility to GameManagementService
        return ctx.gameManagementService.listPlayerReadiness(gameId);
      }),
    getTurnIncome: trpc.procedure
      .input(z.object({ gameId: z.string(), gameTurnId: z.string() }))
      .query(async ({ input }) => {
        const { gameId, gameTurnId } = input;
        //get players for game
        const players = await ctx.playerService.players({ where: { gameId } });
        const playerIds = players.map((player) => player.id); 
        return ctx.gameManagementService.getTurnIncome(playerIds, gameTurnId);
      }),
  });
