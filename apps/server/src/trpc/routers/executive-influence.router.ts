import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { ExecutiveInfluenceService } from '@server/executive-influence/executive-influence.service';
import { ExecutivePhaseName, InfluenceLocation } from '@prisma/client';
import { ExecutiveInfluenceBidService } from '@server/executive-influence-bid/executive-influence-bid.service';
import { ExecutiveGameManagementService } from '@server/executive-game-management/executive-game-management.service';
import { TRPCError } from '@trpc/server';
import { ExecutiveCardService } from '@server/executive-card/executive-card.service';
import { ExecutiveGameService } from '@server/executive-game/executive-game.service';

type Context = {
  executiveInfluenceService: ExecutiveInfluenceService;
  executiveInfluenceBidService: ExecutiveInfluenceBidService;
  executiveGameManagementService: ExecutiveGameManagementService;
  executiveCardService: ExecutiveCardService;
  executiveGameService: ExecutiveGameService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    // Retrieve a specific Influence by unique input
    getInfluence: trpc.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { id } = input;
        const influence = await ctx.executiveInfluenceService.getInfluence({
          id,
        });
        if (!influence) {
          throw new Error('Influence not found');
        }
        return influence;
      }),

    // List all Influences with optional filtering, pagination, and sorting
    listInfluences: trpc.procedure
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
        return ctx.executiveInfluenceService.listInfluences({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    listInfluenceBids: trpc.procedure
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
        return ctx.executiveInfluenceBidService.listExecutiveInfluenceBids({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    // Move InfluenceBid to Player
    moveInfluenceBidToPlayer: trpc.procedure
      .input(
        z.object({
          executiveInfluenceBidId: z.string(),
          targetLocation: z.nativeEnum(InfluenceLocation),
          isBidLocked: z.boolean(),
          gameId: z.string(),
        }),
      )
      .mutation(async ({ input }) => {
        const { executiveInfluenceBidId, targetLocation, isBidLocked, gameId } =
          input;
        const isLocked = ctx.executiveGameService.checkLockAndLock(gameId);
        if (isLocked) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Game is locked',
          });
        }
        let executiveInfluenceBid;
        try {
          executiveInfluenceBid =
            await ctx.executiveInfluenceBidService.getExecutiveInfluenceBid({
              id: executiveInfluenceBidId,
            });
        } catch (error) {
          ctx.executiveGameService.unlockInput(gameId);
        }
        if (!executiveInfluenceBid) {
          throw new Error('Executive Influence Bid not found');
        }
        try {
          await ctx.executiveInfluenceService.moveInfluenceBidToPlayer(
            executiveInfluenceBid,
            targetLocation,
            isBidLocked,
          );
        } catch (error) {
          ctx.executiveGameService.unlockInput(gameId);
          console.error('moveInfluenceBidToPlayer error', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Move Influence Bid to Player error',
          });
        }
        //exchange the bribe card and move gifts for player
        try {
          await ctx.executiveCardService.exchangeBribe(
            executiveInfluenceBid.toPlayerId,
            executiveInfluenceBid.fromPlayerId,
            isBidLocked,
          );
        } catch (error) {
          ctx.executiveGameService.unlockInput(gameId);
          console.error('exchangeBribe error', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Exchange Bribe error',
          });
        }

        let executiveBid;
        try {
          executiveBid =
            await ctx.executiveInfluenceBidService.getExecutiveInfluenceBid({
              id: executiveInfluenceBidId,
            });
        } catch (error) {
          ctx.executiveGameService.unlockInput(gameId);
          console.error('getExecutiveInfluenceBid error', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Get Executive Influence Bid error',
          });
        }
        if (!executiveBid) {
          ctx.executiveGameService.unlockInput(gameId);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Executive Influence Bid not found',
          });
        }
        try {
          await ctx.executiveGameManagementService.startPhase({
            gameId: executiveBid.gameId,
            gameTurnId: executiveBid.executiveGameTurnId,
            phaseName: ExecutivePhaseName.INFLUENCE_BID_SELECTION,
          });
        } catch (error) {
          ctx.executiveGameService.unlockInput(gameId);
          console.error('nextPhase error', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Next phase error',
          });
        }
        ctx.executiveGameService.unlockInput(gameId);
        return { success: true };
      }),
    takeNoInfluenceBid: trpc.procedure
      .input(
        z.object({
          gameId: z.string(),
          gameTurnId: z.string(),
          toPlayerId: z.string(),
        }),
      )
      .mutation(async ({ input }) => {
        const { gameId, gameTurnId, toPlayerId } = input;
        const isLocked = ctx.executiveGameService.checkLockAndLock(gameId);
        if (isLocked) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Game is locked',
          });
        }
        try {
          await ctx.executiveInfluenceService.moveInfluenceBackToOwningPlayers(
            gameTurnId,
            toPlayerId,
          );
        } catch (error) {
          ctx.executiveGameService.unlockInput(gameId);
          console.error('moveInfluenceBackToOwningPlayers error', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Move influence back to owning players error',
          });
        }
        try {
          await ctx.executiveGameManagementService.startPhase({
            gameId,
            gameTurnId,
            phaseName: ExecutivePhaseName.INFLUENCE_BID_SELECTION,
          });
        } catch (error) {
          ctx.executiveGameService.unlockInput(gameId);
          console.error('nextPhase error', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Next phase error',
          });
        }
        ctx.executiveGameService.unlockInput(gameId);
        return { success: true };
      }),
  });
