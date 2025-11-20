import { z } from 'zod';
import { MarketingService } from '../../marketing/marketing.service';
import { TrpcService } from '../trpc.service';
import { MarketingCampaignTier, OperationMechanicsVersion, ResourceType } from '@prisma/client';

const CreateMarketingCampaignSchema = z.object({
  companyId: z.string(),
  gameId: z.string(),
  tier: z.nativeEnum(MarketingCampaignTier),
  operationMechanicsVersion: z.nativeEnum(OperationMechanicsVersion),
  resourceTypes: z.array(z.nativeEnum(ResourceType)), // Resources selected by player
});

type Context = {
  marketingService: MarketingService;
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