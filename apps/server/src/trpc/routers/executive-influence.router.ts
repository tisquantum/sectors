import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { ExecutiveInfluenceService } from '@server/executive-influence/executive-influence.service';
import { ExecutivePhaseName, InfluenceLocation } from '@prisma/client';
import { ExecutiveInfluenceBidService } from '@server/executive-influence-bid/executive-influence-bid.service';
import { ExecutiveGameManagementService } from '@server/executive-game-management/executive-game-management.service';

type Context = {
  executiveInfluenceService: ExecutiveInfluenceService;
  executiveInfluenceBidService: ExecutiveInfluenceBidService;
  executiveGameManagementService: ExecutiveGameManagementService;
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
        }),
      )
      .mutation(async ({ input }) => {
        const { executiveInfluenceBidId, targetLocation } = input;
        const executiveInfluenceBid =
          await ctx.executiveInfluenceBidService.getExecutiveInfluenceBid({
            id: executiveInfluenceBidId,
          });

        if (!executiveInfluenceBid) {
          throw new Error('Executive Influence Bid not found');
        }

        await ctx.executiveInfluenceService.moveInfluenceBidToPlayer(
          executiveInfluenceBid,
          targetLocation,
        );
        const executiveBid = await ctx.executiveInfluenceBidService.getExecutiveInfluenceBid({
          id: executiveInfluenceBidId,
        });
        if (!executiveBid) {
          throw new Error('Executive Influence Bid not found');
        }
        await ctx.executiveGameManagementService.nextPhase(executiveBid.gameId, executiveBid.executiveGameTurnId, ExecutivePhaseName.INFLUENCE_BID_SELECTION);
        return { success: true };
      }),
  });
