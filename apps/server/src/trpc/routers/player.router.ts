import { z } from 'zod';
import { PlayersService } from '@server/players/players.service';
import { TrpcService } from '../trpc.service';
import { Prisma } from '@prisma/client';

type Context = {
  playersService: PlayersService;
};

// Nested Map: gameId -> Map<playerId, boolean>
const gamePlayerReadyStatus = new Map<string, Map<string, boolean>>();

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getPlayer: trpc.procedure
      .input(z.object({ where: z.any().optional(), }))
      .query(async ({ input }) => {
        const { where } = input;
        const player = await ctx.playersService.player(where);
        if (!player) {
          throw new Error('Player not found');
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

    createPlayer: trpc.procedure
      .input(
        z.object({
          nickname: z.string(),
          cashOnHand: z.number(),
          userId: z.string(),
          Game: z.object({
            connect: z.object({ id: z.string() }).optional(),
            create: z
              .object({
                name: z.string(),
                currentTurn: z.number(),
                currentOrSubRound: z.number(),
                currentRound: z.string(),
                currentActivePlayer: z.string().nullable().optional(),
                bankPoolNumber: z.number(),
                consumerPoolNumber: z.number(),
                gameStatus: z.string(),
                gameStep: z.number(),
                currentPhase: z.string(),
                players: z.any().optional(),
                companies: z.any().optional(),
                Player: z.any().optional(),
                Company: z.any().optional(),
                User: z.any().optional(),
                StockRound: z.any().optional(),
                OperatingRound: z.any().optional(),
                ResearchDeck: z.any().optional(),
                Room: z.any().optional(),
              })
              .optional(),
          }),
          PlayerStock: z.any().optional(),
          GamePlayer: z.any().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const data: Prisma.PlayerCreateInput = { ...input, User: { connect: { id: input.userId } } };
        const player = await ctx.playersService.createPlayer(data);
        // Initialize the player as not ready for the game
        // Initialize the player's ready status to false in the game
        if (data.Game?.connect?.id || data.Game?.create?.id) {
          const gameId = data.Game.connect?.id || data.Game.create?.id;
          if (gameId) {
            if (!gamePlayerReadyStatus.has(gameId)) {
              gamePlayerReadyStatus.set(gameId, new Map<string, boolean>());
            }
            gamePlayerReadyStatus.get(gameId)!.set(player.id, false);
          }
        }
        return player;
      }),

    updatePlayer: trpc.procedure
      .input(
        z.object({
          id: z.string(),
          data: z.object({
            nickname: z.string().optional(),
            cashOnHand: z.number().optional(),
            Game: z
              .object({
                connect: z.object({ id: z.string() }).optional(),
                create: z
                  .object({
                    name: z.string(),
                    currentTurn: z.number(),
                    currentOrSubRound: z.number(),
                    currentRound: z.string(),
                    currentActivePlayer: z.string().nullable().optional(),
                    bankPoolNumber: z.number(),
                    consumerPoolNumber: z.number(),
                    gameStatus: z.string(),
                    gameStep: z.number(),
                    currentPhase: z.string(),
                    players: z.any().optional(),
                    companies: z.any().optional(),
                    Player: z.any().optional(),
                    Company: z.any().optional(),
                    StockRound: z.any().optional(),
                    OperatingRound: z.any().optional(),
                    ResearchDeck: z.any().optional(),
                    Room: z.any().optional(),
                  })
                  .optional(),
              })
              .optional(),
            PlayerStock: z.any().optional(),
            GamePlayer: z.any().optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, data } = input;
        return ctx.playersService.updatePlayer({ where: { id }, data });
      }),

    deletePlayer: trpc.procedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const { id } = input;
        return ctx.playersService.deletePlayer({ id });
      }),

    playerReady: trpc.procedure
      .input(z.object({ playerId: z.string(), gameId: z.string() }))
      .mutation(async ({ input }) => {
        const { playerId, gameId } = input;
        const player = await ctx.playersService.player({ id: playerId });
        if (!player) {
          throw new Error('Player not found');
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

    areAllPlayersReady: trpc.procedure
      .input(z.object({ gameId: z.string() }))
      .query(async ({ input }) => {
        const { gameId } = input;

        if (!gamePlayerReadyStatus.has(gameId)) {
          throw new Error('Game not found');
        }

        const gamePlayers = gamePlayerReadyStatus.get(gameId);
        if (!gamePlayers) {
          return { allReady: false };
        }

        for (const ready of gamePlayers.values()) {
          if (!ready) {
            return { allReady: false };
          }
        }

        return { allReady: true };
      }),
  });
