import { Injectable } from '@nestjs/common';
import { Phase, PhaseName, Game, Company, Resource, MarketingCampaign, FactoryBlueprint, FactorySize, ResourceType, ResourceTrackType, FactoryBlueprintType, OrderType, TransactionType, EntityType, SectorName } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GameLogService } from '../game-log/game-log.service';
import { CompanyService } from '../company/company.service';
import { SectorService } from '../sector/sector.service';

interface RequiredResource {
  type: ResourceType;
  quantity: number;
}

@Injectable()
export class ModernOperationMechanicsService {
  constructor(
    private prisma: PrismaService,
    private gameLogService: GameLogService,
    private companyService: CompanyService,
    private sectorService: SectorService,
  ) {}

  async handlePhase(phase: Phase, game: Game) {
    switch (phase.name) {
      case PhaseName.START_TURN:
        await this.updateResourcePrices(phase);
        await this.updateWorkforceTrack(phase);
        break;

      case PhaseName.SHAREHOLDER_MEETING:
        await this.handleShareholderMeeting(phase);
        break;

      case PhaseName.FACTORY_CONSTRUCTION:
        await this.handleFactoryConstruction(game.id, phase.id);
        break;

      case PhaseName.MARKETING_CAMPAIGN:
        await this.handleMarketingCampaigns(phase);
        break;

      case PhaseName.RESEARCH_ACTION:
        await this.handleResearchActions(phase);
        break;

      case PhaseName.CONSUMPTION_PHASE:
        await this.handleConsumptionPhase(phase);
        break;

      case PhaseName.OPERATING_PRODUCTION:
        await this.resolveModernOperatingProduction(phase);
        break;

      case PhaseName.END_TURN:
        await this.degradeMarketingCampaigns(phase);
        await this.updateResearchProgress(phase);
        break;

      default:
        // For any phase not explicitly handled in modern mechanics,
        // return false to indicate it should be handled by legacy mechanics
        return false;
    }
    return true;
  }

  private async updateResourcePrices(phase: Phase) {
    // Update global and sector-specific resource prices based on availability
    // Implementation will use Resource model and ResourceTrackType
  }

  private async updateWorkforceTrack(phase: Phase) {
    // Update workforce track and economy score
    // Handle worker movement between factories and marketing
  }

  private async resolveModernOperatingProduction(phase: Phase) {
    // New production resolution using factory blueprints and resources
    // Calculate units sold based on resource prices and unit prices
  }

  private async handleShareholderMeeting(phase: Phase) {
    // Handle shareholder voting for company actions
    // Process votes based on influence (shares)
  }

  private async handleFactoryConstruction(gameId: string, phaseId: string): Promise<void> {
    // Fetch game state with necessary relations
  }

  private getMaxFactories(technologyLevel: number): number {
    switch (technologyLevel) {
      case 1:
        return 2;
      case 2:
        return 3;
      case 3:
        return 4;
      case 4:
        return 5;
      default:
        return 2;
    }
  }

  private getRequiredWorkers(size: FactorySize): number {
    switch (size) {
      case FactorySize.FACTORY_I:
        return 2;
      case FactorySize.FACTORY_II:
        return 4;
      case FactorySize.FACTORY_III:
        return 6;
      case FactorySize.FACTORY_IV:
        return 8;
      default:
        return 2;
    }
  }

  private getFactoryConsumerLimit(size: FactorySize): number {
    switch (size) {
      case FactorySize.FACTORY_I:
        return 3;
      case FactorySize.FACTORY_II:
        return 4;
      case FactorySize.FACTORY_III:
        return 5;
      case FactorySize.FACTORY_IV:
        return 6;
      default:
        return 3;
    }
  }

  async getRequiredResourcesForFactory(size: FactorySize, sectorName: SectorName): Promise<RequiredResource[]> {
    // Base resources required for each factory size
    const baseResources: RequiredResource[] = [];
    
    switch (size) {
      case FactorySize.FACTORY_I:
        baseResources.push({ type: ResourceType.TRIANGLE, quantity: 1 });
        break;
      case FactorySize.FACTORY_II:
        baseResources.push({ type: ResourceType.TRIANGLE, quantity: 1 });
        baseResources.push({ type: ResourceType.SQUARE, quantity: 1 });
        break;
      case FactorySize.FACTORY_III:
        baseResources.push({ type: ResourceType.TRIANGLE, quantity: 2 });
        baseResources.push({ type: ResourceType.SQUARE, quantity: 1 });
        baseResources.push({ type: ResourceType.CIRCLE, quantity: 1 });
        break;
      case FactorySize.FACTORY_IV:
        baseResources.push({ type: ResourceType.TRIANGLE, quantity: 2 });
        baseResources.push({ type: ResourceType.SQUARE, quantity: 2 });
        baseResources.push({ type: ResourceType.CIRCLE, quantity: 1 });
        break;
    }

    // Add sector-specific resource requirements
    const sectorResource = this.getSectorResourceType(sectorName);
    if (sectorResource) {
      baseResources.push({ type: sectorResource, quantity: 1 });
    }

    return baseResources;
  }

  private getSectorResourceType(sectorName: SectorName): ResourceType | null {
    switch (sectorName) {
      case SectorName.MATERIALS:
        return ResourceType.MATERIALS;
      case SectorName.INDUSTRIALS:
        return ResourceType.INDUSTRIALS;
      case SectorName.CONSUMER_DISCRETIONARY:
        return ResourceType.CONSUMER_DISCRETIONARY;
      case SectorName.CONSUMER_STAPLES:
        return ResourceType.CONSUMER_STAPLES;
      case SectorName.CONSUMER_CYCLICAL:
        return ResourceType.CONSUMER_CYCLICAL;
      case SectorName.CONSUMER_DEFENSIVE:
        return ResourceType.CONSUMER_DEFENSIVE;
      case SectorName.ENERGY:
        return ResourceType.ENERGY;
      case SectorName.HEALTHCARE:
        return ResourceType.HEALTHCARE;
      case SectorName.TECHNOLOGY:
        return ResourceType.TECHNOLOGY;
      default:
        return null;
    }
  }

  async getFactoryCost(size: FactorySize, resources: RequiredResource[]): Promise<number> {
    let baseCost = 100;
    switch (size) {
      case FactorySize.FACTORY_I:
        baseCost = 100;
        break;
      case FactorySize.FACTORY_II:
        baseCost = 200;
        break;
      case FactorySize.FACTORY_III:
        baseCost = 300;
        break;
      case FactorySize.FACTORY_IV:
        baseCost = 400;
        break;
      default:
        baseCost = 100;
        break;
    }

    // Get current resource prices from the game
    const resourcePrices = await this.prisma.resource.findMany({
      where: {
        type: {
          in: resources.map(r => r.type),
        },
      },
    });

    // Calculate total resource cost
    const resourceCost = resources.reduce((sum, resource) => {
      const price = resourcePrices.find(r => r.type === resource.type)?.price || 0;
      return sum + (price * resource.quantity);
    }, 0);

    return baseCost + resourceCost;
  }

  private async handleMarketingCampaigns(phase: Phase) {
    // Handle marketing campaign setup and worker allocation
    // Update brand scores and sector consumption bags
  }

  private async handleResearchActions(phase: Phase) {
    // Handle research actions and card draws
    // Update research progress and grant rewards
  }

  private async handleConsumptionPhase(phase: Phase) {
    // Handle consumption phase
    // Process sector consumption bags and customer allocation
    // Update sector scores based on service quality
  }

  private async degradeMarketingCampaigns(phase: Phase) {
    // Degrade marketing campaigns by one turn
    // Remove expired campaigns and their effects
  }

  private async updateResearchProgress(phase: Phase) {
    // Update research progress and check for milestone rewards
    // Update technology sentiment tracker
  }
} 