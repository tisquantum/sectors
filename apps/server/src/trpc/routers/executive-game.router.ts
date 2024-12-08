import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { ExecutiveGameService } from '@server/executive-game/executive-game.service';
import { ExecutiveGameManagementService } from '@server/executive-game-management/executive-game-management.service';
import { ExecutiveGameTurnService } from '@server/executive-game-turn/executive-game-turn.service';
import { TRPCError } from '@trpc/server';
import { ExecutiveInfluenceVoteRoundService } from '@server/executive-influence-vote-round/executive-influence-vote-round.service';
import { timingSafeEqual } from 'crypto';

type Context = {
  executiveGameService: ExecutiveGameService;
  executiveGameManagementService: ExecutiveGameManagementService;
  executiveGameTurnService: ExecutiveGameTurnService;
  executiveInfluenceVoteRoundService: ExecutiveInfluenceVoteRoundService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    // Retrieve a specific ExecutiveGame by unique input
    getExecutiveGame: trpc.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { id } = input;
        const game = await ctx.executiveGameService.getExecutiveGame({ id });
        if (!game) {
          throw new Error('ExecutiveGame not found');
        }
        return game;
      }),

    // List all ExecutiveGames with optional filtering, pagination, and sorting
    listExecutiveGames: trpc.procedure
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
        return ctx.executiveGameService.listExecutiveGames({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),
    startGame: trpc.procedure
      .input(z.object({ roomId: z.number(), gameName: z.string() }))
      .mutation(async ({ input }) => {
        const { roomId, gameName } = input;
        await ctx.executiveGameManagementService.startGame(roomId, gameName);
      }),
    createInfluenceBid: trpc.procedure
      .input(
        z.object({
          gameId: z.string(),
          fromPlayerId: z.string(),
          toPlayerId: z.string(),
          influenceAmount: z.number(),
        }),
      )
      .mutation(async ({ input }) => {
        const { gameId, fromPlayerId, toPlayerId, influenceAmount } = input;
        const isLocked = ctx.executiveGameService.checkLockAndLock(gameId);
        if (isLocked) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Game is locked',
          });
        }
        try {
          await ctx.executiveGameManagementService.createExecutiveInfluenceBidFromClient(
            {
              fromPlayerId,
              toPlayerId,
              influenceAmount,
            },
          );
        } catch (error) {
          console.error('createInfluenceBid error', error);
          ctx.executiveGameService.unlockInput(gameId);
        }
        ctx.executiveGameService.unlockInput(gameId);
        return { success: true };
      }),
    playerPass: trpc.procedure
      .input(z.object({ gameId: z.string(), playerId: z.string() }))
      .mutation(async ({ input }) => {
        const { gameId, playerId } = input;
        const isLocked = ctx.executiveGameService.checkLockAndLock(gameId);
        if (isLocked) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Game is locked',
          });
        }
        console.log('playerPass', playerId);
        try {
          await ctx.executiveGameManagementService.playerPass(gameId, playerId);
        } catch (error) {
          ctx.executiveGameService.unlockInput(gameId);
        }
        ctx.executiveGameService.unlockInput(gameId);
        return { success: true };
      }),
    playTrick: trpc.procedure
      .input(
        z.object({
          playerId: z.string(),
          cardId: z.string(),
          gameId: z.string(),
        }),
      )
      .mutation(async ({ input }) => {
        const { playerId, cardId, gameId } = input;
        const isLocked = ctx.executiveGameService.checkLockAndLock(gameId);
        if (isLocked) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Game is locked',
          });
        }
        let currentTurn;
        try {
          currentTurn =
            await ctx.executiveGameTurnService.getLatestTurn(gameId);
        } catch (error) {
          ctx.executiveGameService.unlockInput(gameId);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message,
          });
        }
        if (!currentTurn) {
          ctx.executiveGameService.unlockInput(gameId);

          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'No turn found',
          });
        }
        try {
          await ctx.executiveGameManagementService.playCardIntoTrick(
            cardId,
            playerId,
            currentTurn.gameId,
            currentTurn.id,
          );
        } catch (error) {
          ctx.executiveGameService.unlockInput(gameId);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message,
          });
        }
        ctx.executiveGameService.unlockInput(gameId);
        return { success: true };
      }),
    createPlayerVote: trpc.procedure
      .input(
        z.object({
          gameId: z.string(),
          playerId: z.string(),
          influenceIds: z.array(z.string()),
        }),
      )
      .mutation(async ({ input }) => {
        const { gameId, playerId, influenceIds } = input;
        const isLocked = ctx.executiveGameService.checkLockAndLock(gameId);
        if (isLocked) {
          ctx.executiveGameService.unlockInput(gameId);

          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Game is locked',
          });
        }
        let voteRound;
        try {
          voteRound = await ctx.executiveGameManagementService.createPlayerVote(
            influenceIds,
            playerId,
          );
        } catch (error) {
          ctx.executiveGameService.unlockInput(gameId);
        }
        try {
          if (!voteRound) {
            ctx.executiveGameService.unlockInput(gameId);

            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Vote round not found',
            });
          }
          await ctx.executiveGameManagementService.moveToNextVoter(
            gameId,
            voteRound.id,
            playerId,
          );
        } catch (error) {
          ctx.executiveGameService.unlockInput(gameId);

          console.error('nextVoter error', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Next voter error',
          });
        }
        ctx.executiveGameService.unlockInput(gameId);
        return { success: true };
      }),
  });
