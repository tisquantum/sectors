import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, MarketingCampaignTier, OperationMechanicsVersion, MarketingCampaignStatus } from '@prisma/client';
import { z } from 'zod';

const CreateMarketingCampaignSchema = z.object({
  companyId: z.string(),
  gameId: z.string(),
  tier: z.nativeEnum(MarketingCampaignTier),
  operationMechanicsVersion: z.nativeEnum(OperationMechanicsVersion),
});

type CreateMarketingCampaignInput = z.infer<typeof CreateMarketingCampaignSchema>;

@Injectable()
export class MarketingService {
  constructor(private readonly prisma: PrismaService) {}

  async createCampaign(input: CreateMarketingCampaignInput) {
    const { companyId, gameId, tier, operationMechanicsVersion } = input;

    // Get company to check funds
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { cashOnHand: true },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    const cost = this.calculateCampaignCost(tier, operationMechanicsVersion);
    if (company.cashOnHand < cost) {
      throw new Error('Insufficient funds');
    }

    // Create campaign and update company cash in a transaction
    return this.prisma.$transaction(async (tx) => {
      const campaign = await tx.marketingCampaign.create({
        data: {
          companyId,
          gameId,
          tier,
          workers: this.getWorkersForTier(tier),
          brandBonus: this.getBrandBonusForTier(tier),
          status: MarketingCampaignStatus.ACTIVE,
        },
      });

      await tx.company.update({
        where: { id: companyId },
        data: { cashOnHand: { decrement: cost } },
      });

      return campaign;
    });
  }

  private calculateCampaignCost(tier: MarketingCampaignTier, operationMechanicsVersion: OperationMechanicsVersion): number {
    // Base cost for tier
    const baseCost = this.getBaseCostForTier(tier);

    // Additional cost for operation mechanics version
    const versionCost = operationMechanicsVersion === OperationMechanicsVersion.MODERN ? 100 : 0; // $100 for modern mechanics

    return baseCost + versionCost;
  }

  private getBaseCostForTier(tier: MarketingCampaignTier): number {
    switch (tier) {
      case MarketingCampaignTier.TIER_1: return 100;
      case MarketingCampaignTier.TIER_2: return 200;
      case MarketingCampaignTier.TIER_3: return 300;
      default: throw new Error(`Unknown marketing tier: ${tier}`);
    }
  }

  private getWorkersForTier(tier: MarketingCampaignTier): number {
    switch (tier) {
      case MarketingCampaignTier.TIER_1: return 1;
      case MarketingCampaignTier.TIER_2: return 2;
      case MarketingCampaignTier.TIER_3: return 3;
      default: throw new Error(`Unknown marketing tier: ${tier}`);
    }
  }

  private getBrandBonusForTier(tier: MarketingCampaignTier): number {
    switch (tier) {
      case MarketingCampaignTier.TIER_1: return 1;
      case MarketingCampaignTier.TIER_2: return 2;
      case MarketingCampaignTier.TIER_3: return 3;
      default: throw new Error(`Unknown marketing tier: ${tier}`);
    }
  }

  private getResourceBonusForTier(tier: MarketingCampaignTier): number {
    switch (tier) {
      case MarketingCampaignTier.TIER_1: return 1;
      case MarketingCampaignTier.TIER_2: return 2;
      case MarketingCampaignTier.TIER_3: return 3;
      default: throw new Error(`Unknown marketing tier: ${tier}`);
    }
  }

  async decayMarketingCampaigns(gameId: string) {
    // Find all active campaigns
    const activeCampaigns = await this.prisma.marketingCampaign.findMany({
      where: {
        gameId,
        status: MarketingCampaignStatus.ACTIVE,
      },
    });

    // Update campaigns to decaying status
    await this.prisma.marketingCampaign.updateMany({
      where: {
        gameId,
        status: MarketingCampaignStatus.ACTIVE,
      },
      data: {
        status: MarketingCampaignStatus.DECAYING,
      },
    });

    return activeCampaigns;
  }

  async getCompanyCampaigns(companyId: string, gameId: string) {
    return this.prisma.marketingCampaign.findMany({
      where: {
        companyId,
        gameId,
        status: {
          in: [MarketingCampaignStatus.ACTIVE, MarketingCampaignStatus.DECAYING],
        },
      },
    });
  }

  async getTotalBrandBonus(companyId: string, gameId: string) {
    const campaigns = await this.prisma.marketingCampaign.findMany({
      where: {
        companyId,
        gameId,
        status: {
          in: [MarketingCampaignStatus.ACTIVE, MarketingCampaignStatus.DECAYING],
        },
      },
    });

    return campaigns.reduce((total, campaign) => total + campaign.brandBonus, 0);
  }
} 