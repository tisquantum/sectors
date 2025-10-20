import { Injectable } from '@nestjs/common';
import { Phase, PhaseName, Game, Company, Resource, MarketingCampaign, FactorySize, ResourceType, ResourceTrackType, OrderType, TransactionType, EntityType, SectorName, FactoryConstructionOrder, MarketingCampaignTier, MarketingCampaignStatus, StockAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GameLogService } from '../game-log/game-log.service';
import { CompanyService } from '../company/company.service';
import { SectorService } from '../sector/sector.service';
import { FactoryConstructionOrderService } from '../factory-construction/factory-construction-order.service';
import { FactoryService } from '@server/factory/factory.service';
import { ResourceService } from '../resource/resource.service';
import { ConsumptionMarkerService } from '../consumption-marker/consumption-marker.service';
import { MarketingService } from '../marketing/marketing.service';
import { FactoryProductionService } from '../factory-production/factory-production.service';
import { StockHistoryService } from '../stock-history/stock-history.service';
import { getResourcePriceForResourceType, getSectorResourceForSectorName, BASE_WORKER_SALARY } from '@server/data/constants';

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
    private factoryService: FactoryService,
    private factoryConstructionOrderService: FactoryConstructionOrderService,
    private resourceService: ResourceService,
    private consumptionMarkerService: ConsumptionMarkerService,
    private marketingService: MarketingService,
    private factoryProductionService: FactoryProductionService,
    private stockHistoryService: StockHistoryService,
  ) {}

  async handlePhase(phase: Phase, game: Game) {
    switch (phase.name) {
      case PhaseName.START_TURN:
        await this.updateResourcePrices(phase);
        await this.updateWorkforceTrack(phase);
        await this.makeFactoriesOperational(phase);
        break;

      case PhaseName.SHAREHOLDER_MEETING:
        await this.handleShareholderMeeting(phase);
        break;

      case PhaseName.CONSUMPTION_PHASE:
        await this.handleConsumptionPhase(phase);
        break;

      case PhaseName.FACTORY_CONSTRUCTION:
        // Players submit factory construction orders (handled by client)
        break;

      case PhaseName.FACTORY_CONSTRUCTION_RESOLVE:
        await this.resolveFactoryConstruction(phase);
        break;

      case PhaseName.MARKETING_AND_RESEARCH_ACTION:
        // Players submit marketing and research actions (handled by client)
        break;

      case PhaseName.MARKETING_AND_RESEARCH_ACTION_RESOLVE:
        await this.resolveMarketingAndResearchActions(phase);
        break;

      case PhaseName.EARNINGS_CALL:
        await this.handleEarningsCall(phase);
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

  /**
   * FACTORY_CONSTRUCTION_RESOLVE
   * Resolve all factory construction orders from the FACTORY_CONSTRUCTION phase.
   * Companies pay for blueprint costs and factories are created.
   */
  private async resolveFactoryConstruction(phase: Phase) {
    const factoryConstructionOrders = await this.prisma.factoryConstructionOrder.findMany({
      where: { gameTurnId: phase.gameTurnId },
    });
    
    if (factoryConstructionOrders.length === 0) {
      await this.gameLogService.createGameLog({
        game: { connect: { id: phase.gameId } },
        content: 'No factory construction orders to resolve',
      });
      return;
    }

    // Process all orders simultaneously (same resource prices for all)
    const resources = await this.resourceService.resourcesByGame(phase.gameId);
    const resourcePriceMap = new Map<ResourceType, number>();
    
    for (const resource of resources) {
      const price = await this.resourceService.getCurrentResourcePrice(resource);
      resourcePriceMap.set(resource.type, price);
    }

    for (const order of factoryConstructionOrders) {
      // Fetch company with relations
      const company = await this.prisma.company.findUnique({
        where: { id: order.companyId },
            include: { Sector: true },
          });

          if (!company) {
            await this.gameLogService.createGameLog({
              game: { connect: { id: phase.gameId } },
          content: `Company ${order.companyId} not found for factory construction`,
            });
            continue;
          }

      // Calculate total blueprint cost
      let blueprintCost = 0;
      const resourcesNeeded: { type: ResourceType; count: number }[] = [];
      
      for (const resourceType of order.resourceTypes) {
        const price = resourcePriceMap.get(resourceType) || 0;
        blueprintCost += price;
        resourcesNeeded.push({ type: resourceType, count: 1 });
      }

      // Check if company can afford it
      if (company.cashOnHand < blueprintCost) {
              await this.gameLogService.createGameLog({
                game: { connect: { id: phase.gameId } },
          content: `${company.name} cannot afford factory construction. Cost: $${blueprintCost}, Cash: $${company.cashOnHand}`,
              });
              continue;
          }

      try {
        await this.prisma.$transaction(async (tx) => {
          // Deduct cash from company
          await tx.company.update({
            where: { id: company.id },
            data: { cashOnHand: { decrement: blueprintCost } },
          });

          // Get next available slot
          const existingFactories = await tx.factory.count({
            where: { companyId: company.id, gameId: phase.gameId },
          });

          // Create factory (will be operational next turn)
          const factory = await tx.factory.create({
            data: {
              companyId: company.id,
              sectorId: company.sectorId,
            gameId: phase.gameId,
              size: order.size,
              workers: this.getRequiredWorkers(order.size),
              slot: existingFactories + 1,
              isOperational: false,
              resourceTypes: order.resourceTypes,
            },
          });

          // Delete the construction order
          await tx.factoryConstructionOrder.delete({
            where: { id: order.id },
          });

          await this.gameLogService.createGameLog({
            game: { connect: { id: phase.gameId } },
            content: `${company.name} built ${order.size} factory for $${blueprintCost}`,
          });
        });

        // Add permanent consumption marker to sector bag (after transaction)
        // Company chooses which resource type from factory output
        const factoryOutputResource = order.resourceTypes[0]; // First resource in blueprint
        await this.consumptionMarkerService.addFactoryMarkerToBag(
          phase.gameId,
          company.sectorId,
          company.id,
          factoryOutputResource,
        );
      } catch (error) {
        await this.gameLogService.createGameLog({
          game: { connect: { id: phase.gameId } },
          content: `Factory construction failed for ${company.name}: ${error.message}`,
        });
      }
    }

    // Consume resources AFTER all orders processed (simultaneous pricing)
    const totalResourceConsumptions = new Map<ResourceType, number>();
    for (const order of factoryConstructionOrders) {
      for (const resourceType of order.resourceTypes) {
        totalResourceConsumptions.set(
          resourceType,
          (totalResourceConsumptions.get(resourceType) || 0) + 1
        );
      }
    }

    const consumptions = Array.from(totalResourceConsumptions.entries()).map(
      ([type, count]) => ({ type, count })
    );
    
    if (consumptions.length > 0) {
      await this.resourceService.consumeResources(phase.gameId, consumptions);
    await this.resourceService.updateResourcePrices(phase.gameId);
    }
    
    await this.updateWorkforceTrack(phase);
  }

  private async updateResourcePrices(phase: Phase) {
    // Update global and sector-specific resource prices based on availability
    await this.resourceService.updateResourcePrices(phase.gameId);
    
    await this.gameLogService.createGameLog({
      game: { connect: { id: phase.gameId } },
      phase: { connect: { id: phase.id } },
      content: 'Resource prices updated based on supply and demand',
    });
  }

  private async updateWorkforceTrack(phase: Phase) {
    // Get current game state
    const game = await this.prisma.game.findUnique({
      where: { id: phase.gameId },
      include: {
        factories: true,
        Company: {
          include: {
            marketingCampaigns: true,
          },
        },
      },
    });

    if (!game) {
      return;
    }

    // Calculate total workers in factories
    const totalFactoryWorkers = game.factories.reduce((sum: number, factory: any) => sum + factory.workers, 0);
    
    // Calculate total workers in marketing campaigns
    const totalMarketingWorkers = game.Company.reduce((sum: number, company: any) => {
      return sum + company.marketingCampaigns.reduce((campaignSum: number, campaign: any) => campaignSum + campaign.workers, 0);
    }, 0);

    // Calculate total allocated workers
    const totalAllocatedWorkers = totalFactoryWorkers + totalMarketingWorkers;
    
    // Update available workers in game
    const availableWorkers = Math.max(0, game.workers - totalAllocatedWorkers);
    
    await this.prisma.game.update({
      where: { id: phase.gameId },
      data: { workers: availableWorkers },
    });

    // Update economy score based on worker allocation
    const economyScore = Math.floor((totalFactoryWorkers / Math.max(1, totalAllocatedWorkers)) * 100);
    
    await this.prisma.game.update({
      where: { id: phase.gameId },
      data: { economyScore },
    });

    await this.gameLogService.createGameLog({
      game: { connect: { id: phase.gameId } },
      phase: { connect: { id: phase.id } },
      content: `Workforce track updated: ${totalFactoryWorkers} factory workers, ${totalMarketingWorkers} marketing workers, ${availableWorkers} available`,
    });
  }

  /**
   * Make factories operational at the start of turn
   * Factories built in previous turn become operational now
   */
  private async makeFactoriesOperational(phase: Phase) {
    const inoperativeFactories = await this.prisma.factory.findMany({
      where: {
        gameId: phase.gameId,
        isOperational: false,
      },
      include: {
        company: true,
      },
    });

    if (inoperativeFactories.length === 0) {
      return;
    }

    await this.prisma.factory.updateMany({
      where: {
        gameId: phase.gameId,
        isOperational: false,
      },
      data: {
        isOperational: true,
      },
    });

    for (const factory of inoperativeFactories) {
      await this.gameLogService.createGameLog({
        game: { connect: { id: phase.gameId } },
        content: `${factory.company.name}'s ${factory.size} factory is now operational`,
      });
    }
  }

  /**
   * SHAREHOLDER_MEETING
   * Process shareholder votes for company actions
   * Actions: Lobby, Outsource, Licensing Agreement, Increase/Decrease Unit Price, Share Issue/Buyback
   */
  private async handleShareholderMeeting(phase: Phase) {
    // This would process votes similar to OPERATING_ACTION_COMPANY_VOTE in legacy system
    // For now, this is a placeholder - voting logic would be handled by frontend
    await this.gameLogService.createGameLog({
      game: { connect: { id: phase.gameId } },
      content: 'Shareholder meeting completed',
    });
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


  /**
   * CONSUMPTION_PHASE
   * Draw goods from sector consumption bags for each customer.
   * Customers go to the company with highest attraction rating (lowest effective price).
   * Track which factories fill up and service customers.
   */
  private async handleConsumptionPhase(phase: Phase) {
    const sectors = await this.sectorService.sectors({
      where: { gameId: phase.gameId },
    });

    for (const sector of sectors) {
      const customerCount = sector.consumers;
      
      if (customerCount === 0) {
        continue;
      }

      // Get all consumption markers for this sector
      const markers = await this.consumptionMarkerService.consumptionMarkersBySector(
        sector.id,
        phase.gameId,
      );

      if (markers.length === 0) {
        await this.gameLogService.createGameLog({
          game: { connect: { id: phase.gameId } },
          content: `${sector.sectorName} has no consumption markers in bag`,
        });
        continue;
      }

      // Get all operational factories in this sector
      const factories = await this.prisma.factory.findMany({
        where: {
          sectorId: sector.id,
          gameId: phase.gameId,
          isOperational: true,
        },
        include: {
          company: {
            include: {
              marketingCampaigns: {
                where: {
                  status: { in: [MarketingCampaignStatus.ACTIVE, MarketingCampaignStatus.DECAYING] },
                },
              },
            },
          },
        },
      });

      // Track customers served per factory
      const factoryCustomerCounts = new Map<string, number>();
      for (const factory of factories) {
        factoryCustomerCounts.set(factory.id, 0);
      }

      let customersServed = 0;
      const markersDrawn: string[] = [];

      // Draw from consumption bag for each customer
      for (let i = 0; i < customerCount; i++) {
        // Draw a random marker
        const availableMarkers = markers.filter(m => !markersDrawn.includes(m.id));
        
        if (availableMarkers.length === 0) {
          break; // No more markers to draw
        }

        const randomIndex = Math.floor(Math.random() * availableMarkers.length);
        const drawnMarker = availableMarkers[randomIndex];
        markersDrawn.push(drawnMarker.id);

        // Find factories that can produce this resource, sorted by attraction rating
        const eligibleFactories = factories
          .filter(f => {
            const currentCustomers = factoryCustomerCounts.get(f.id) || 0;
            const maxCustomers = this.getFactoryConsumerLimit(f.size);
            const canProduceResource = f.resourceTypes.includes(drawnMarker.resourceType);
            return canProduceResource && currentCustomers < maxCustomers;
          })
          .sort((a, b) => {
            // Sort by attraction rating (unit price - brand score)
            // Customers prefer most complex factories (higher size) with lowest effective price
            const aAttractionRating = this.calculateAttractionRating(a.company);
            const bAttractionRating = this.calculateAttractionRating(b.company);
            
            if (aAttractionRating === bAttractionRating) {
              // Tie-breaker: prefer more complex factories
              return this.getFactoryComplexity(b.size) - this.getFactoryComplexity(a.size);
            }
            
            return aAttractionRating - bAttractionRating;
          });

        if (eligibleFactories.length > 0) {
          const selectedFactory = eligibleFactories[0];
          factoryCustomerCounts.set(
            selectedFactory.id,
            (factoryCustomerCounts.get(selectedFactory.id) || 0) + 1
          );
          customersServed++;
        }

        // Remove temporary markers after drawing
        if (!drawnMarker.isPermanent) {
          await this.consumptionMarkerService.deleteConsumptionMarker({
            id: drawnMarker.id,
          });
        }
      }

      // Update sector score based on service quality
      const unservedCustomers = customerCount - customersServed;
      
      if (unservedCustomers > 0) {
        // Reduce sector score for each unserved customer
        await this.sectorService.updateSector({
          where: { id: sector.id },
          data: { demand: Math.max(0, sector.demand - unservedCustomers) },
        });

        await this.gameLogService.createGameLog({
          game: { connect: { id: phase.gameId } },
          content: `${sector.sectorName} failed to service ${unservedCustomers} customers. Sector score reduced.`,
        });
      } else {
        // All customers serviced - increase sector score
        await this.sectorService.updateSector({
          where: { id: sector.id },
          data: { demand: sector.demand + 1 },
        });

        await this.gameLogService.createGameLog({
          game: { connect: { id: phase.gameId } },
          content: `${sector.sectorName} serviced all customers! Sector score increased.`,
        });
      }

      // Log factory performance
      for (const [factoryId, customers] of factoryCustomerCounts.entries()) {
        if (customers > 0) {
          const factory = factories.find(f => f.id === factoryId);
          if (factory) {
            await this.gameLogService.createGameLog({
              game: { connect: { id: phase.gameId } },
              content: `${factory.company.name}'s factory served ${customers} customers`,
            });
          }
        }
      }

      // Create FactoryProduction records for each factory that served customers
      const factoryProductionRecords = [];
      for (const [factoryId, customers] of factoryCustomerCounts.entries()) {
        const factory = factories.find(f => f.id === factoryId);
        if (factory && customers > 0) {
          factoryProductionRecords.push({
            factoryId: factory.id,
            gameId: phase.gameId,
            gameTurnId: phase.gameTurnId,
            companyId: factory.company.id,
            customersServed: customers,
            revenue: 0, // Calculated in EARNINGS_CALL
            costs: 0,   // Calculated in EARNINGS_CALL
            profit: 0,  // Calculated in EARNINGS_CALL
          });
        }
      }

      if (factoryProductionRecords.length > 0) {
        await this.factoryProductionService.createManyFactoryProductions(factoryProductionRecords);
      }
    }
  }

  /**
   * Calculate attraction rating for a company
   * Lower rating = more attractive to customers
   */
  private calculateAttractionRating(company: any): number {
    const totalBrandBonus = company.marketingCampaigns.reduce(
      (sum: number, campaign: any) => sum + campaign.brandBonus,
      0,
    );
    return company.unitPrice - totalBrandBonus;
  }

  /**
   * Get factory complexity rating (higher = more complex)
   */
  private getFactoryComplexity(size: FactorySize): number {
    switch (size) {
      case FactorySize.FACTORY_I: return 1;
      case FactorySize.FACTORY_II: return 2;
      case FactorySize.FACTORY_III: return 3;
      case FactorySize.FACTORY_IV: return 4;
      default: return 1;
    }
  }

  /**
   * MARKETING_AND_RESEARCH_ACTION_RESOLVE
   * Process marketing campaigns and research actions submitted by players
   */
  private async resolveMarketingAndResearchActions(phase: Phase) {
    // Get all marketing campaigns created this turn
    const newMarketingCampaigns = await this.prisma.marketingCampaign.findMany({
      where: {
        gameId: phase.gameId,
        status: MarketingCampaignStatus.ACTIVE,
      },
      include: {
        Company: {
          include: { Sector: true },
        },
      },
    });

    // Add marketing markers to consumption bags
    for (const campaign of newMarketingCampaigns) {
      const company = campaign.Company;
      const sectorResourceType = getSectorResourceForSectorName(company.Sector.sectorName);
      const markerCount = this.getMarketingResourceBonus(campaign.tier);

      await this.consumptionMarkerService.addMarketingMarkersToBag(
        phase.gameId,
        company.sectorId,
        company.id,
        sectorResourceType,
        markerCount,
      );

      // Update company brand score
      await this.companyService.updateCompany({
        where: { id: company.id },
        data: {
          brandScore: company.brandScore + campaign.brandBonus,
        },
      });

      await this.gameLogService.createGameLog({
        game: { connect: { id: phase.gameId } },
        content: `${company.name} launched ${campaign.tier} marketing campaign (+${campaign.brandBonus} brand, +${markerCount} consumption markers)`,
      });
    }

    // Handle research actions
    // Get companies that increased research progress this turn
    const companies = await this.companyService.companies({
      where: {
        gameId: phase.gameId,
        researchProgress: { gt: 0 },
      },
    });

    for (const company of companies) {
      // Research grants at milestones
      if (company.researchProgress === 5) {
        await this.companyService.updateCompany({
          where: { id: company.id },
          data: {
            researchGrants: company.researchGrants + 1,
            cashOnHand: company.cashOnHand + 200, // Grant money
          },
        });

        await this.gameLogService.createGameLog({
          game: { connect: { id: phase.gameId } },
          content: `${company.name} reached research milestone! Received $200 grant.`,
        });
      } else if (company.researchProgress === 10) {
        await this.companyService.updateCompany({
          where: { id: company.id },
          data: {
            marketFavors: company.marketFavors + 1,
          },
        });

        await this.gameLogService.createGameLog({
          game: { connect: { id: phase.gameId } },
          content: `${company.name} reached research milestone! Received market favor (stock boost).`,
        });
      }
    }
  }

  /**
   * Get marketing resource bonus for tier
   */
  private getMarketingResourceBonus(tier: MarketingCampaignTier): number {
    switch (tier) {
      case MarketingCampaignTier.TIER_1: return 1;
      case MarketingCampaignTier.TIER_2: return 2;
      case MarketingCampaignTier.TIER_3: return 3;
      default: return 1;
    }
  }

  /**
   * EARNINGS_CALL
   * Calculate profits based on actual customers served (from FactoryProduction records).
   * Update FactoryProduction records with revenue, costs, and profit.
   * Adjust stock prices based on profitability.
   */
  private async handleEarningsCall(phase: Phase) {
    // Get all factory production records for this turn
    const factoryProductions = await this.factoryProductionService.factoryProductionsWithRelations({
      where: { gameTurnId: phase.gameTurnId },
    });

    if (factoryProductions.length === 0) {
      await this.gameLogService.createGameLog({
        game: { connect: { id: phase.gameId } },
        content: 'No factory production records found for earnings call',
      });
      return;
    }

    // Group by company for consolidated reporting
    const companySummaries = new Map<string, { revenue: number; costs: number; profit: number; company: Company }>();

    for (const production of factoryProductions) {
      const factory = production.Factory;
      const company = production.Company;

      // Get resources used in factory blueprint
      const resources = await this.resourceService.resources({
        where: {
          gameId: phase.gameId,
          type: { in: factory.resourceTypes },
        },
      });

      // Calculate revenue per unit sold (sum of all resource prices + unit price)
      let revenuePerUnit = company.unitPrice;
      for (const resource of resources) {
        const price = await this.resourceService.getCurrentResourcePrice(resource);
        revenuePerUnit += price;
      }

      // Calculate actual revenue based on customers served (EXACT count from consumption phase)
      const factoryRevenue = production.customersServed * revenuePerUnit;

      // Calculate worker costs
      const factoryCosts = factory.workers * BASE_WORKER_SALARY;

      // Calculate profit
      const factoryProfit = factoryRevenue - factoryCosts;

      // Update the production record with calculated values
      await this.factoryProductionService.updateFactoryProduction({
        where: { id: production.id },
        data: {
          revenue: factoryRevenue,
          costs: factoryCosts,
          profit: factoryProfit,
        },
      });

      // Aggregate company totals
      if (!companySummaries.has(company.id)) {
        companySummaries.set(company.id, {
          revenue: 0,
          costs: 0,
          profit: 0,
          company,
        });
      }
      const summary = companySummaries.get(company.id)!;
      summary.revenue += factoryRevenue;
      summary.costs += factoryCosts;
      summary.profit += factoryProfit;
    }

    // Process each company's total earnings
    for (const [companyId, summary] of companySummaries.entries()) {
      const { revenue, costs, profit, company } = summary;

      // Update company cash
      await this.companyService.updateCompany({
        where: { id: companyId },
        data: {
          cashOnHand: company.cashOnHand + profit,
        },
      });

      // Stock price adjustment based on profitability
      let stockPriceSteps = 0;
      if (profit > 500) {
        stockPriceSteps = 3;
      } else if (profit > 200) {
        stockPriceSteps = 2;
      } else if (profit > 0) {
        stockPriceSteps = 1;
      } else if (profit < -200) {
        stockPriceSteps = -2;
      } else if (profit < 0) {
        stockPriceSteps = -1;
      }

      // Apply stock price adjustment
      if (stockPriceSteps > 0) {
        await this.stockHistoryService.moveStockPriceUp(
          phase.gameId,
          companyId,
          phase.id,
          company.currentStockPrice || 0,
          stockPriceSteps,
          StockAction.PRODUCTION,
        );
      } else if (stockPriceSteps < 0) {
        await this.stockHistoryService.moveStockPriceDown(
          phase.gameId,
          companyId,
          phase.id,
          company.currentStockPrice || 0,
          Math.abs(stockPriceSteps),
          StockAction.PRODUCTION,
        );
      }

      await this.gameLogService.createGameLog({
        game: { connect: { id: phase.gameId } },
        content: `${company.name} earnings: Revenue $${revenue}, Costs $${costs}, Profit $${profit}. Stock ${stockPriceSteps > 0 ? '+' : ''}${stockPriceSteps} steps.`,
      });
    }
  }

  private async degradeMarketingCampaigns(phase: Phase) {
    // Move ACTIVE campaigns to DECAYING
    await this.prisma.marketingCampaign.updateMany({
      where: {
        gameId: phase.gameId,
        status: MarketingCampaignStatus.ACTIVE,
      },
      data: {
        status: MarketingCampaignStatus.DECAYING,
      },
    });

    // Remove DECAYING campaigns (they expire after 1 turn)
    const expiredCampaigns = await this.prisma.marketingCampaign.findMany({
      where: {
        gameId: phase.gameId,
        status: MarketingCampaignStatus.DECAYING,
      },
      include: {
        Company: true,
      },
    });

    for (const campaign of expiredCampaigns) {
      // Reduce brand score
      await this.companyService.updateCompany({
        where: { id: campaign.companyId },
        data: {
          brandScore: Math.max(0, campaign.Company.brandScore - campaign.brandBonus),
        },
      });

      // Return workers to pool
      await this.prisma.game.update({
        where: { id: phase.gameId },
        data: {
          workers: { increment: campaign.workers },
        },
      });

      // Delete campaign
      await this.prisma.marketingCampaign.delete({
        where: { id: campaign.id },
      });

      await this.gameLogService.createGameLog({
        game: { connect: { id: phase.gameId } },
        content: `${campaign.Company.name}'s marketing campaign expired`,
      });
    }
  }

  private async updateResearchProgress(phase: Phase) {
    // Update sector technology levels based on research progress
    const sectors = await this.sectorService.sectors({
      where: { gameId: phase.gameId },
    });

    for (const sector of sectors) {
      // Get total research progress from all companies in sector
      const companies = await this.companyService.companies({
        where: {
          sectorId: sector.id,
          gameId: phase.gameId,
        },
      });

      const totalResearch = companies.reduce(
        (sum, company) => sum + company.researchProgress,
        0,
      );

      // Update technology level based on milestones
      let newTechLevel = sector.technologyLevel;
      if (totalResearch >= 50 && sector.technologyLevel < 4) {
        newTechLevel = 4;
      } else if (totalResearch >= 30 && sector.technologyLevel < 3) {
        newTechLevel = 3;
      } else if (totalResearch >= 15 && sector.technologyLevel < 2) {
        newTechLevel = 2;
      } else if (totalResearch >= 5 && sector.technologyLevel < 1) {
        newTechLevel = 1;
      }

      if (newTechLevel > sector.technologyLevel) {
        await this.sectorService.updateSector({
          where: { id: sector.id },
          data: { technologyLevel: newTechLevel },
        });

        await this.gameLogService.createGameLog({
          game: { connect: { id: phase.gameId } },
          content: `${sector.sectorName} technology advanced to level ${newTechLevel}! New factory phases unlocked.`,
        });
      }
    }
  }
} 