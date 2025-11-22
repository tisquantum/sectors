import { z } from 'zod';
import { MarketingService } from '../../marketing/marketing.service';
import { TrpcService } from '../trpc.service';
import { MarketingCampaignTier, OperationMechanicsVersion, ResourceType, MarketingCampaignStatus } from '@prisma/client';
import { GamesService } from '@server/games/games.service';
import { GameTurnService } from '@server/game-turn/game-turn.service';
import { PrismaService } from '@server/prisma/prisma.service';

const CreateMarketingCampaignSchema = z.object({
  companyId: z.string(),
  gameId: z.string(),
  tier: z.nativeEnum(MarketingCampaignTier),
  operationMechanicsVersion: z.nativeEnum(OperationMechanicsVersion),
  resourceTypes: z.array(z.nativeEnum(ResourceType)), // Resources selected by player
});

type Context = {
  marketingService: MarketingService;
  gamesService?: GamesService;
  gameTurnService?: GameTurnService;
  prismaService?: PrismaService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    createCampaign: trpc.procedure
      .input(CreateMarketingCampaignSchema)
      .mutation(async ({ input }) => {
        return ctx.marketingService.createCampaign(input);
      }),

    getCompanyCampaigns: trpc.procedure
      .input(z.object({
        companyId: z.string(),
        gameId: z.string(),
      }))
      .query(async ({ input }) => {
        return ctx.marketingService.getCompanyCampaigns(input.companyId, input.gameId);
      }),

    // Get pending marketing campaigns (created this turn, not yet resolved)
    getPendingCampaigns: trpc.procedure
      .input(z.object({
        companyId: z.string(),
        gameId: z.string(),
        gameTurnId: z.string().optional(),
      }))
      .query(async ({ input }) => {
        // Only available if services are provided
        if (!ctx.gamesService || !ctx.gameTurnService || !ctx.prismaService) {
          return [];
        }

        // Get current turn if not provided
        let gameTurnId = input.gameTurnId;
        if (!gameTurnId) {
          const game = await ctx.gamesService.game({ id: input.gameId });
          if (!game?.currentTurn) {
            return [];
          }
          gameTurnId = game.currentTurn;
        }

        // Get the turn to find when it started
        const gameTurn = await ctx.gameTurnService.gameTurn({ id: gameTurnId });
        if (!gameTurn) {
          return [];
        }

        // Get campaigns created during this turn (after turn start)
        // These are "pending" until the resolve phase processes them
        return ctx.prismaService.marketingCampaign.findMany({
          where: {
            companyId: input.companyId,
            gameId: input.gameId,
            status: MarketingCampaignStatus.ACTIVE, // Only active campaigns can be pending
          },
        });
      }),

    getTotalBrandBonus: trpc.procedure
      .input(z.object({
        companyId: z.string(),
        gameId: z.string(),
      }))
      .query(async ({ input }) => {
        return ctx.marketingService.getTotalBrandBonus(input.companyId, input.gameId);
      }),

    decayCampaigns: trpc.procedure
      .input(z.string())
      .mutation(async ({ input: gameId }) => {
        return ctx.marketingService.decayMarketingCampaigns(gameId);
      }),
  }); 