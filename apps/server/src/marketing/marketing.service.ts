import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, MarketingCampaignTier, OperationMechanicsVersion, MarketingCampaignStatus, ResourceType, EntityType, TransactionType } from '@prisma/client';
import { z } from 'zod';
import { TransactionService } from '../transaction/transaction.service';

const CreateMarketingCampaignSchema = z.object({
  companyId: z.string(),
  gameId: z.string(),
  tier: z.nativeEnum(MarketingCampaignTier),
  operationMechanicsVersion: z.nativeEnum(OperationMechanicsVersion),
  resourceTypes: z.array(z.nativeEnum(ResourceType)), // Resources selected by player
});

type CreateMarketingCampaignInput = z.infer<typeof CreateMarketingCampaignSchema>;

@Injectable()
export class MarketingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionService: TransactionService,
  ) {}

  async createCampaign(input: CreateMarketingCampaignInput) {
    const { companyId, gameId, tier, operationMechanicsVersion, resourceTypes } = input;

    // Validate resource count matches tier
    const expectedResourceCount = this.getResourceCountForTier(tier);
    if (resourceTypes.length !== expectedResourceCount) {
      throw new Error(`Campaign ${tier} requires exactly ${expectedResourceCount} resource(s), but ${resourceTypes.length} were provided`);
    }

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

    // Get company with entity and game/phase info for transaction
    const companyWithEntity = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { Entity: true },
    });

    if (!companyWithEntity) {
      throw new Error('Company not found');
    }

    // Get current game and phase for transaction
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      select: { currentTurn: true, currentPhaseId: true },
    });

    // Create campaign and update company cash in a transaction
    const campaign = await this.prisma.$transaction(async (tx) => {
      const campaign = await tx.marketingCampaign.create({
        data: {
          companyId,
          gameId,
          tier,
          workers: this.getWorkersForTier(tier),
          brandBonus: this.getBrandBonusForTier(tier),
          status: MarketingCampaignStatus.ACTIVE,
          resourceTypes, // Store selected resources
        },
      });

      await tx.company.update({
        where: { id: companyId },
        data: { cashOnHand: { decrement: cost } },
      });

      return campaign;
    });

    // Create transaction record for marketing campaign payment
    if (game?.currentTurn && game?.currentPhaseId) {
      try {
        await this.transactionService.createTransactionEntityToEntity({
          gameId,
          gameTurnId: game.currentTurn,
          phaseId: game.currentPhaseId,
          fromEntityType: EntityType.COMPANY,
          toEntityType: EntityType.BANK,
          fromEntityId: companyWithEntity.entityId || undefined,
          amount: cost,
          transactionType: TransactionType.MARKETING_CAMPAIGN,
          fromCompanyId: companyId,
          companyInvolvedId: companyId,
          description: `Marketing campaign ${tier}: $${cost}`,
        });
      } catch (error) {
        // Log error but don't fail the campaign creation
        console.error('Failed to create marketing campaign transaction:', error);
      }
    }

    return campaign;
  }

  private getResourceCountForTier(tier: MarketingCampaignTier): number {
    switch (tier) {
      case MarketingCampaignTier.TIER_1: return 1;
      case MarketingCampaignTier.TIER_2: return 2;
      case MarketingCampaignTier.TIER_3: return 3;
      default: throw new Error(`Unknown marketing tier: ${tier}`);
    }
  }

  private calculateCampaignCost(tier: MarketingCampaignTier, operationMechanicsVersion: OperationMechanicsVersion): number {
    // Base cost for tier (same for legacy and modern)
    return this.getBaseCostForTier(tier);
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