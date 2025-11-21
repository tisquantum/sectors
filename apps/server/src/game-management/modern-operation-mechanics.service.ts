import { Injectable } from '@nestjs/common';
import { Phase, PhaseName, Game, Company, Resource, MarketingCampaign, FactorySize, ResourceType, ResourceTrackType, OrderType, TransactionType, EntityType, SectorName, FactoryConstructionOrder, MarketingCampaignTier, MarketingCampaignStatus, StockAction, CompanyStatus, ShareLocation, TransactionSubType } from '@prisma/client';
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
import { GameTurnService } from '../game-turn/game-turn.service';
import { GamesService } from '../games/games.service';
import { TransactionService } from '../transaction/transaction.service';
import { getResourcePriceForResourceType, getSectorResourceForSectorName, BASE_WORKER_SALARY, CompanyTierData, BANKRUPTCY_SHARE_PERCENTAGE_RETAINED } from '@server/data/constants';
import { PlayerPriorityService } from '@server/player-priority/player-priority.service';
import { PlayersService } from '@server/players/players.service';
import { calculateNetWorth } from '@server/data/helpers';

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
    private gameTurnService: GameTurnService,
    private gamesService: GamesService,
    private transactionService: TransactionService,
    private playerPriorityService: PlayerPriorityService,
    private playersService: PlayersService,
  ) {}

  async handlePhase(phase: Phase, game: Game) {
    switch (phase.name) {
      case PhaseName.START_TURN:
        await this.updateResourcePrices(phase);
        await this.updateWorkforceTrack(phase);
        await this.makeFactoriesOperational(phase);
        await this.updateSectorDemand(phase);
        await this.determinePriorityOrderBasedOnNetWorth(phase);
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

      case PhaseName.RESOLVE_INSOLVENCY:
        await this.handleResolveInsolvency(phase);
        break;

      case PhaseName.END_TURN:
        await this.degradeMarketingCampaigns(phase);
        await this.updateResearchProgress(phase);
        await this.distributeConsumersToSectors(phase);
        await this.createNewTurn(phase);
        break;

      default:
        // For any phase not explicitly handled in modern mechanics,
        // return false to indicate it should be handled by legacy mechanics
        return false;
    }
    return true;
  }

  async determinePriorityOrderBasedOnNetWorth(phase: Phase) {
    const gameTurnPromise = this.gameTurnService.getCurrentTurn(phase.gameId);
    const playersPromise = this.playersService.playersWithShares({
      gameId: phase.gameId,
    });
    //get player priorities
    const playerPrioritiesPromise =
      this.playerPriorityService.listPlayerPriorities({
        where: { gameTurnId: phase.gameTurnId },
      });

    const [gameTurn, players, playerPriorities] = await Promise.all([
      gameTurnPromise,
      playersPromise,
      playerPrioritiesPromise,
    ]);

    if (!gameTurn) {
      throw new Error('Game turn not found');
    }

    if (gameTurn.turn === 1) {
      return;
    }

    //if player priorities already exist, do not recreate them
    if (playerPriorities.length > 0) {
      return;
    }

    const netWorths = players.map((player) => {
      return {
        playerId: player.id,
        netWorth: calculateNetWorth(player.cashOnHand, player.Share),
      };
    });

    const priorityPlayerOrder = netWorths.sort(
      (a, b) => a.netWorth - b.netWorth,
    );

    const playerPriority = priorityPlayerOrder.map((playerPriority, index) => ({
      playerId: playerPriority.playerId,
      priority: index + 1,
      gameTurnId: phase.gameTurnId,
    }));

    await this.playerPriorityService.createManyPlayerPriorities(playerPriority);
  }

  /**
   * FACTORY_CONSTRUCTION_RESOLVE
   * Resolve all factory construction orders from the FACTORY_CONSTRUCTION phase.
   * Companies pay for blueprint costs and factories are created.
   */
  private async resolveFactoryConstruction(phase: Phase) {
    console.log('resolveFactoryConstruction', phase);
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
    
    // Calculate prices in parallel (no DB queries needed, uses constants)
    for (const resource of resources) {
      const price = await this.resourceService.getCurrentResourcePrice(resource);
      resourcePriceMap.set(resource.type, price);
    }

    // Get game for worker availability check
    const game = await this.prisma.game.findUnique({
      where: { id: phase.gameId },
    });

    if (!game) {
      await this.gameLogService.createGameLog({
        game: { connect: { id: phase.gameId } },
        content: 'Game not found for factory construction resolution',
      });
      return;
    }

    // OPTIMIZATION: Batch fetch all companies at once
    const companyIds = [...new Set(factoryConstructionOrders.map(o => o.companyId))];
    const companies = await this.prisma.company.findMany({
      where: { id: { in: companyIds } },
      include: { Sector: true, Entity: true },
    });
    const companyMap = new Map(companies.map(c => [c.id, c]));

    // OPTIMIZATION: Batch count all factories at once
    const factoryCounts = await this.prisma.factory.groupBy({
      by: ['companyId'],
      where: { gameId: phase.gameId },
      _count: { id: true },
    });
    const factoryCountMap = new Map(
      factoryCounts.map(f => [f.companyId, f._count.id])
    );

    // Track successful order IDs for resource consumption
    const successfulOrderIds = new Set<string>();
    // Collect game log entries for batch creation
    const gameLogEntries: Array<{ gameId: string; content: string; phaseId?: string }> = [];
    // Collect order updates for batch processing
    const orderUpdates: Array<{ id: string; failureReason: string }> = [];
    // Collect successful operations for batch processing
    const successfulOperations: Array<{
      order: FactoryConstructionOrder;
      company: Company;
      blueprintCost: number;
      requiredWorkers: number;
      existingFactories: number;
      factoryOutputResource: ResourceType;
    }> = [];

    for (const order of factoryConstructionOrders) {
      // Get company from map (already fetched)
      const company = companyMap.get(order.companyId);

      if (!company) {
        const failureReason = `Company ${order.companyId} not found`;
        orderUpdates.push({ id: order.id, failureReason });
        gameLogEntries.push({ gameId: phase.gameId, content: failureReason });
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
        const failureReason = `Insufficient cash. Required: $${blueprintCost}, Available: $${company.cashOnHand}`;
        orderUpdates.push({ id: order.id, failureReason });
        gameLogEntries.push({
          gameId: phase.gameId,
          content: `${company.name} cannot afford factory construction. ${failureReason}`,
        });
        continue;
      }

      // Check factory limit based on sector technology level
      const existingFactories = factoryCountMap.get(company.id) || 0;
      
      const maxFactories = this.getMaxFactories(company.Sector.technologyLevel);
      if (existingFactories >= maxFactories) {
        const failureReason = `Factory limit reached. Maximum factories allowed: ${maxFactories} (based on sector technology level ${company.Sector.technologyLevel})`;
        orderUpdates.push({ id: order.id, failureReason });
        gameLogEntries.push({
          gameId: phase.gameId,
          content: `${company.name} cannot build more factories. ${failureReason}`,
        });
        continue;
      }

      // Check worker availability
      const requiredWorkers = this.getRequiredWorkers(order.size);
      if (game.workers < requiredWorkers) {
        const failureReason = `Insufficient workers in workforce pool. Required: ${requiredWorkers}, Available: ${game.workers}`;
        orderUpdates.push({ id: order.id, failureReason });
        gameLogEntries.push({
          gameId: phase.gameId,
          content: `${company.name} cannot build factory. ${failureReason}`,
        });
        continue;
      }

      // Store successful operation for batch processing
      successfulOperations.push({
        order,
        company,
        blueprintCost,
        requiredWorkers,
        existingFactories,
        factoryOutputResource: order.resourceTypes[0], // First resource in blueprint
      });
    }

    // OPTIMIZATION: Batch update failed orders
    if (orderUpdates.length > 0) {
      await this.prisma.$transaction(
        orderUpdates.map(update =>
          this.prisma.factoryConstructionOrder.update({
            where: { id: update.id },
            data: { failureReason: update.failureReason },
          })
        )
      );
    }

    // Process successful operations in batches
    for (const op of successfulOperations) {
      try {
        let createdFactoryId: string | null = null;
        
        await this.prisma.$transaction(async (tx) => {
          // Deduct cash from company
          await tx.company.update({
            where: { id: op.company.id },
            data: { cashOnHand: { decrement: op.blueprintCost } },
          });

          // Create factory (will be operational next turn)
          const factory = await tx.factory.create({
            data: {
              companyId: op.company.id,
              sectorId: op.company.sectorId,
              gameId: phase.gameId,
              size: op.order.size,
              workers: op.requiredWorkers,
              slot: op.existingFactories + 1,
              isOperational: false,
              resourceTypes: op.order.resourceTypes,
            },
          });
          
          createdFactoryId = factory.id;

          // Deduct workers from workforce pool
          await tx.game.update({
            where: { id: phase.gameId },
            data: { workers: { decrement: op.requiredWorkers } },
          });

          // Delete the construction order on success
          await tx.factoryConstructionOrder.delete({
            where: { id: op.order.id },
          });
        });

        // Create transaction record for factory construction
        if (createdFactoryId) {
          try {
            await this.transactionService.createTransactionEntityToEntity({
              gameId: phase.gameId,
              gameTurnId: phase.gameTurnId,
              phaseId: phase.id,
              fromEntityType: EntityType.COMPANY,
              toEntityType: EntityType.BANK,
              fromEntityId: op.company.entityId || undefined,
              amount: op.blueprintCost,
              transactionType: TransactionType.FACTORY_CONSTRUCTION,
              fromCompanyId: op.company.id,
              companyInvolvedId: op.company.id,
              description: `Factory construction: ${op.order.size} factory built for $${op.blueprintCost}`,
            });
          } catch (error) {
            // Log error but don't fail the factory construction
            console.error('Failed to create factory construction transaction:', error);
          }
        }

        // Track successful order for resource consumption
        successfulOrderIds.add(op.order.id);

        // Collect game log entry
        gameLogEntries.push({
          gameId: phase.gameId,
          content: `${op.company.name} built ${op.order.size} factory for $${op.blueprintCost}`,
        });

        // Add permanent consumption marker to sector bag (after transaction)
        await this.consumptionMarkerService.addFactoryMarkerToBag(
          phase.gameId,
          op.company.sectorId,
          op.company.id,
          op.factoryOutputResource,
        );
      } catch (error) {
        const failureReason = `Construction failed: ${error instanceof Error ? error.message : String(error)}`;
        orderUpdates.push({ id: op.order.id, failureReason });
        gameLogEntries.push({
          gameId: phase.gameId,
          content: `Factory construction failed for ${op.company.name}: ${failureReason}`,
        });
      }
    }

    // Consume resources ONLY for successfully completed orders (simultaneous pricing)
    // Resources are consumed at the same prices for all successful orders
    const totalResourceConsumptions = new Map<ResourceType, number>();
    
    // Only consume resources for orders that succeeded (tracked before deletion)
    for (const order of factoryConstructionOrders) {
      if (successfulOrderIds.has(order.id)) {
        for (const resourceType of order.resourceTypes) {
          totalResourceConsumptions.set(
            resourceType,
            (totalResourceConsumptions.get(resourceType) || 0) + 1
          );
        }
      }
    }

    const consumptions = Array.from(totalResourceConsumptions.entries()).map(
      ([type, count]) => ({ type, count })
    );
    
    if (consumptions.length > 0) {
      await this.resourceService.consumeResources(phase.gameId, consumptions);
      await this.resourceService.updateResourcePrices(phase.gameId);
    }
    
    // OPTIMIZATION: Batch create all game logs at once
    if (gameLogEntries.length > 0) {
      await this.gameLogService.createManyGameLogs(
        gameLogEntries.map(entry => ({
          gameId: entry.gameId,
          phaseId: entry.phaseId || phase.id,
          content: entry.content,
        }))
      );
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

    // Note: Economy score is NOT updated here - it's controlled by adjustEconomyScore()
    // which adjusts based on dividends vs retained earnings, not worker allocation

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

    // OPTIMIZATION: Batch create game logs
    if (inoperativeFactories.length > 0) {
      await this.gameLogService.createManyGameLogs(
        inoperativeFactories.map(factory => ({
          gameId: phase.gameId,
          content: `${factory.company.name}'s ${factory.size} factory is now operational`,
        }))
      );
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

    // Track sector updates and total consumers returned to pool
    const sectorUpdates: Array<{ id: string; consumers: number }> = [];
    let totalConsumersReturnedToPool = 0;

    for (const sector of sectors) {
      console.log('sector', sector.sectorName, 'consumers', sector.consumers);
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

      console.log('factories', factories.length);

      // Track customers served per factory
      const factoryCustomerCounts = new Map<string, number>();
      for (const factory of factories) {
        factoryCustomerCounts.set(factory.id, 0);
      }

      let customersServed = 0;
      const markersDrawn: string[] = [];
      // OPTIMIZATION: Collect markers to delete for batch deletion
      const markersToDelete: string[] = [];

      // Draw from consumption bag for each customer
      for (let i = 0; i < customerCount; i++) {
        // Draw a random marker
        // Only filter out temporary markers that have been drawn
        // Permanent markers can be reused multiple times
        const availableMarkers = markers.filter(m => {
          // If it's a permanent marker, it's always available (can be reused)
          if (m.isPermanent) {
            return true;
          }
          // If it's a temporary marker, check if it's already been drawn
          return !markersDrawn.includes(m.id);
        });
        
        if (availableMarkers.length === 0) {
          break; // No more markers to draw
        }

        const randomIndex = Math.floor(Math.random() * availableMarkers.length);
        const drawnMarker = availableMarkers[randomIndex];
        
        // Only track temporary markers in markersDrawn (permanent markers can be reused)
        if (!drawnMarker.isPermanent) {
          markersDrawn.push(drawnMarker.id);
        }

        // Find factories that can produce this resource, sorted by attraction rating
        const eligibleFactories = factories
          .filter(f => {
            const currentCustomers = factoryCustomerCounts.get(f.id) || 0;
            console.log('factory', f.id, 'currentCustomers', currentCustomers);
            const maxCustomers = this.getFactoryConsumerLimit(f.size);
            console.log('factory', f.id, 'maxCustomers', maxCustomers);
            
            // Check if factory can produce the resource
            // GENERAL is a wildcard that matches any factory with general resources (TRIANGLE, SQUARE, CIRCLE)
            let canProduceResource: boolean;
            if (drawnMarker.resourceType === ResourceType.GENERAL) {
              // GENERAL matches any factory that has at least one general resource type
              const generalResourceTypes: ResourceType[] = [ResourceType.TRIANGLE, ResourceType.SQUARE, ResourceType.CIRCLE];
              canProduceResource = f.resourceTypes.some(rt => generalResourceTypes.includes(rt as ResourceType));
            } else {
              // For specific resource types, check if:
              // 1. Factory has that exact type in resourceTypes, OR
              // 2. The marker type matches the factory's sector resource type (factories can always produce their sector's resource)
              const sectorResourceType = this.getSectorResourceType(sector.sectorName);
              const hasExactType = f.resourceTypes.includes(drawnMarker.resourceType);
              const matchesSectorResource = sectorResourceType !== null && drawnMarker.resourceType === sectorResourceType;
              canProduceResource = hasExactType || matchesSectorResource;
            }
            
            console.log('factory', f.id, 'canProduceResource', canProduceResource, 'markerType', drawnMarker.resourceType, 'factoryTypes', f.resourceTypes, 'sectorResourceType', this.getSectorResourceType(sector.sectorName));
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

        console.log('eligibleFactories', eligibleFactories.length);

        if (eligibleFactories.length > 0) {
          const selectedFactory = eligibleFactories[0];
          factoryCustomerCounts.set(
            selectedFactory.id,
            (factoryCustomerCounts.get(selectedFactory.id) || 0) + 1
          );
          customersServed++;
          console.log('selectedFactory', selectedFactory.id, 'customersServed', customersServed);
        }

        // Collect temporary markers for batch deletion
        if (!drawnMarker.isPermanent) {
          markersToDelete.push(drawnMarker.id);
        }
      }

      // OPTIMIZATION: Batch delete temporary markers
      if (markersToDelete.length > 0) {
        await this.prisma.consumptionMarker.deleteMany({
          where: { id: { in: markersToDelete } },
        });
      }

      // Track sector update: remove serviced consumers from sector
      if (customersServed > 0) {
        sectorUpdates.push({
          id: sector.id,
          consumers: Math.max(0, sector.consumers - customersServed),
        });
        totalConsumersReturnedToPool += customersServed;
      }

      // Note: Sector demand is now calculated based on base sector demand + brand scores
      // No longer updated based on service quality
      const unservedCustomers = customerCount - customersServed;

      // OPTIMIZATION: Collect game log entries for batch creation
      const sectorGameLogEntries: Array<{ gameId: string; content: string }> = [];

      // Log factory performance
      for (const [factoryId, customers] of factoryCustomerCounts.entries()) {
        if (customers > 0) {
          const factory = factories.find(f => f.id === factoryId);
          if (factory) {
            sectorGameLogEntries.push({
              gameId: phase.gameId,
              content: `${factory.company.name}'s factory served ${customers} customers`,
            });
          }
        }
      }

      // Add sector-level log entries
      if (unservedCustomers > 0) {
        sectorGameLogEntries.push({
          gameId: phase.gameId,
          content: `${sector.sectorName} failed to service ${unservedCustomers} customers.`,
        });
      } else {
        sectorGameLogEntries.push({
          gameId: phase.gameId,
          content: `${sector.sectorName} serviced all customers!`,
        });
      }

      // Batch create all game logs for this sector
      if (sectorGameLogEntries.length > 0) {
        await this.gameLogService.createManyGameLogs(
          sectorGameLogEntries.map(entry => ({
            gameId: entry.gameId,
            content: entry.content,
          }))
        );
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

    // Batch update sectors: remove serviced consumers
    if (sectorUpdates.length > 0) {
      await this.prisma.$transaction(
        sectorUpdates.map(update =>
          this.prisma.sector.update({
            where: { id: update.id },
            data: { consumers: update.consumers },
          })
        )
      );
    }

    // Update game: return all serviced consumers to global pool
    if (totalConsumersReturnedToPool > 0) {
      const game = await this.prisma.game.findUnique({
        where: { id: phase.gameId },
        select: { consumerPoolNumber: true },
      });

      if (game) {
        await this.prisma.game.update({
          where: { id: phase.gameId },
          data: {
            consumerPoolNumber: game.consumerPoolNumber + totalConsumersReturnedToPool,
          },
        });

        // Log the return to pool
        await this.gameLogService.createGameLog({
          game: { connect: { id: phase.gameId } },
          content: `${totalConsumersReturnedToPool} serviced consumers returned to global consumer pool.`,
        });
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

    // OPTIMIZATION: Collect company updates and game logs for batch processing
    const companyBrandUpdates: Array<{ id: string; brandScore: number }> = [];
    const marketingGameLogEntries: Array<{ gameId: string; content: string }> = [];

    // Add marketing markers to consumption bags using selected resources
    for (const campaign of newMarketingCampaigns) {
      const company = campaign.Company;
      
      // Use the resources selected by the player when creating the campaign
      // Campaign 1: 1 resource, Campaign 2: 2 resources, Campaign 3: 3 resources
      // Type assertion needed until Prisma types are regenerated after schema change
      const selectedResources = (campaign as any).resourceTypes || [];
      
      if (selectedResources.length === 0) {
        // Fallback: if no resources were selected (legacy campaigns), use sector resource
        const sectorResourceType = getSectorResourceForSectorName(company.Sector.sectorName);
        const markerCount = this.getMarketingResourceBonus(campaign.tier);
        
        await this.consumptionMarkerService.addMarketingMarkersToBag(
          phase.gameId,
          company.sectorId,
          company.id,
          sectorResourceType,
          markerCount,
        );
      } else {
        // Add one marker for each selected resource (temporary markers)
        for (const resourceType of selectedResources) {
          await this.consumptionMarkerService.addMarketingMarkersToBag(
            phase.gameId,
            company.sectorId,
            company.id,
            resourceType,
            1, // One marker per selected resource
          );
        }
      }

      // Collect company brand score update
      companyBrandUpdates.push({
        id: company.id,
        brandScore: company.brandScore + campaign.brandBonus,
      });

      // Collect game log entry
      const resourceCount = selectedResources.length || this.getMarketingResourceBonus(campaign.tier);
      marketingGameLogEntries.push({
        gameId: phase.gameId,
        content: `${company.name} launched ${campaign.tier} marketing campaign (+${campaign.brandBonus} brand, +${resourceCount} consumption markers)`,
      });
    }

    // OPTIMIZATION: Batch update company brand scores
    if (companyBrandUpdates.length > 0) {
      await this.prisma.$transaction(
        companyBrandUpdates.map(update =>
          this.prisma.company.update({
            where: { id: update.id },
            data: { brandScore: update.brandScore },
          })
        )
      );
    }

    // Handle research actions
    // Get companies that increased research progress this turn
    const companies = await this.companyService.companies({
      where: {
        gameId: phase.gameId,
        researchProgress: { gt: 0 },
      },
    });

    // OPTIMIZATION: Collect research updates and game logs
    const researchCompanyUpdates: Array<{
      id: string;
      researchGrants?: number;
      cashOnHand?: number;
      marketFavors?: number;
    }> = [];
    const researchGameLogEntries: Array<{ gameId: string; content: string }> = [];

    for (const company of companies) {
      // Research grants at milestones
      if (company.researchProgress === 5) {
        researchCompanyUpdates.push({
          id: company.id,
          researchGrants: company.researchGrants + 1,
          cashOnHand: company.cashOnHand + 200, // Grant money
        });

        researchGameLogEntries.push({
          gameId: phase.gameId,
          content: `${company.name} reached research milestone! Received $200 grant.`,
        });
      } else if (company.researchProgress === 10) {
        researchCompanyUpdates.push({
          id: company.id,
          marketFavors: company.marketFavors + 1,
        });

        researchGameLogEntries.push({
          gameId: phase.gameId,
          content: `${company.name} reached research milestone! Received market favor (stock boost).`,
        });
      }
    }

    // OPTIMIZATION: Batch update research companies
    if (researchCompanyUpdates.length > 0) {
      await this.prisma.$transaction(
        researchCompanyUpdates.map(update => {
          const data: any = {};
          if (update.researchGrants !== undefined) data.researchGrants = update.researchGrants;
          if (update.cashOnHand !== undefined) data.cashOnHand = update.cashOnHand;
          if (update.marketFavors !== undefined) data.marketFavors = update.marketFavors;
          
          return this.prisma.company.update({
            where: { id: update.id },
            data,
          });
        })
      );
    }

    // OPTIMIZATION: Batch create all game logs
    const allGameLogEntries = [...marketingGameLogEntries, ...researchGameLogEntries];
    if (allGameLogEntries.length > 0) {
      await this.gameLogService.createManyGameLogs(
        allGameLogEntries.map(entry => ({
          gameId: entry.gameId,
          content: entry.content,
        }))
      );
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

    // OPTIMIZATION: Fetch all resources once and build price map
    const allResources = await this.resourceService.resourcesByGame(phase.gameId);
    const resourcePriceMap = new Map<ResourceType, number>();
    
    // Calculate all resource prices in parallel
    await Promise.all(
      allResources.map(async (resource) => {
        const price = await this.resourceService.getCurrentResourcePrice(resource);
        resourcePriceMap.set(resource.type, price);
      })
    );

    // Calculate worker salaries based on sector demand ranking
    // 1st highest demand = $10, 2nd = $8, 3rd+ = $6
    const sectors = await this.sectorService.sectors({
      where: { gameId: phase.gameId },
    });
    
    // Sort sectors by demand (descending) - using effective demand (demand + demandBonus)
    const sortedSectors = [...sectors].sort((a, b) => {
      const aDemand = a.demand + (a.demandBonus || 0);
      const bDemand = b.demand + (b.demandBonus || 0);
      return bDemand - aDemand; // Descending order
    });

    // Create map: sectorId -> worker salary
    const sectorWorkerSalaryMap = new Map<string, number>();
    sortedSectors.forEach((sector, index) => {
      let salary: number;
      if (index === 0) {
        salary = 8; // Highest demand: $8
      } else if (index === 1) {
        salary = 4; // Second highest: $4
      } else {
        salary = 2; // Third and below: $2
      }
      sectorWorkerSalaryMap.set(sector.id, salary);
    });

    // Log worker salary assignments for debugging
    const salaryLogEntries: Array<{ gameId: string; content: string }> = [];
    sortedSectors.forEach((sector, index) => {
      const salary = sectorWorkerSalaryMap.get(sector.id) || 6;
      const effectiveDemand = sector.demand + (sector.demandBonus || 0);
      salaryLogEntries.push({
        gameId: phase.gameId,
        content: `${sector.sectorName} ranked #${index + 1} (demand: ${effectiveDemand}) → Worker salary: $${salary}/worker`,
      });
    });
    if (salaryLogEntries.length > 0) {
      await this.gameLogService.createManyGameLogs(
        salaryLogEntries.map(entry => ({
          gameId: entry.gameId,
          content: entry.content,
        }))
      );
    }

    // Group by company for consolidated reporting
    const companySummaries = new Map<string, { revenue: number; costs: number; profit: number; company: Company }>();
    // OPTIMIZATION: Collect production updates for batch processing
    const productionUpdates: Array<{
      id: string;
      revenue: number;
      costs: number;
      profit: number;
    }> = [];

    for (const production of factoryProductions) {
      const factory = production.Factory;
      const company = production.Company;

      // Calculate revenue per unit sold (sum of all resource prices from resource market)
      // Revenue = sum of current resource prices (NOT including unit price)
      // Each customer buys 1:1 units, so total revenue = customersServed × revenuePerUnit
      // OPTIMIZATION: Use pre-calculated price map instead of querying
      let revenuePerUnit = 0;
      for (const resourceType of factory.resourceTypes) {
        const resourcePrice = resourcePriceMap.get(resourceType) || 0;
        revenuePerUnit += resourcePrice;
      }

      // Calculate actual revenue based on customers served (EXACT count from consumption phase)
      const factoryRevenue = production.customersServed * revenuePerUnit;

      // Calculate worker costs based on sector demand ranking
      const workerSalary = sectorWorkerSalaryMap.get(factory.sectorId) || 6; // Default to $6 if sector not found
      const factoryCosts = factory.workers * workerSalary;

      // Calculate profit
      const factoryProfit = factoryRevenue - factoryCosts;

      // Collect update for batch processing
      productionUpdates.push({
        id: production.id,
        revenue: factoryRevenue,
        costs: factoryCosts,
        profit: factoryProfit,
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

    // OPTIMIZATION: Batch update all production records
    if (productionUpdates.length > 0) {
      await this.prisma.$transaction(
        productionUpdates.map(update =>
          this.prisma.factoryProduction.update({
            where: { id: update.id },
            data: {
              revenue: update.revenue,
              costs: update.costs,
              profit: update.profit,
            },
          })
        )
      );
    }

    // OPTIMIZATION: Collect company updates and game logs for batch processing
    const companyUpdates: Array<{ id: string; cashOnHand: number }> = [];
    const stockPriceOperations: Array<{
      companyId: string;
      steps: number;
      currentPrice: number;
    }> = [];
    const earningsGameLogEntries: Array<{ gameId: string; content: string }> = [];

    // Process each company's total earnings
    for (const [companyId, summary] of companySummaries.entries()) {
      const { revenue, costs, profit, company } = summary;

      // Collect company cash update
      companyUpdates.push({
        id: companyId,
        cashOnHand: company.cashOnHand + profit,
      });

      // Create transaction for revenue retention (profit added to company)
      if (profit > 0 && company.entityId) {
        try {
          await this.transactionService.createTransactionEntityToEntity({
            gameId: phase.gameId,
            gameTurnId: phase.gameTurnId,
            phaseId: phase.id,
            fromEntityType: EntityType.BANK,
            toEntityType: EntityType.COMPANY,
            toEntityId: company.entityId,
            amount: profit,
            transactionType: TransactionType.CASH,
            transactionSubType: TransactionSubType.OPERATING_COST,
            toCompanyId: companyId,
            companyInvolvedId: companyId,
            description: `Revenue retention: Revenue $${revenue} - Costs $${costs} = Profit $${profit}`,
          });
        } catch (error) {
          console.error('Failed to create revenue retention transaction:', error);
        }
      }

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

      // Collect stock price operation
      if (stockPriceSteps !== 0) {
        stockPriceOperations.push({
          companyId,
          steps: stockPriceSteps,
          currentPrice: company.currentStockPrice || 0,
        });
      }

      // Collect game log entry
      earningsGameLogEntries.push({
        gameId: phase.gameId,
        content: `${company.name} earnings: Revenue $${revenue}, Costs $${costs}, Profit $${profit}. Stock ${stockPriceSteps > 0 ? '+' : ''}${stockPriceSteps} steps.`,
      });
    }

    // OPTIMIZATION: Batch update company cash
    if (companyUpdates.length > 0) {
      await this.prisma.$transaction(
        companyUpdates.map(update =>
          this.prisma.company.update({
            where: { id: update.id },
            data: { cashOnHand: update.cashOnHand },
          })
        )
      );
    }

    // Apply stock price adjustments (these may need to be sequential due to dependencies)
    for (const op of stockPriceOperations) {
      if (op.steps > 0) {
        await this.stockHistoryService.moveStockPriceUp(
          phase.gameId,
          op.companyId,
          phase.id,
          op.currentPrice,
          op.steps,
          StockAction.PRODUCTION,
        );
      } else {
        await this.stockHistoryService.moveStockPriceDown(
          phase.gameId,
          op.companyId,
          phase.id,
          op.currentPrice,
          Math.abs(op.steps),
          StockAction.PRODUCTION,
        );
      }
    }

    // OPTIMIZATION: Batch create game logs
    if (earningsGameLogEntries.length > 0) {
      await this.gameLogService.createManyGameLogs(
        earningsGameLogEntries.map(entry => ({
          gameId: entry.gameId,
          content: entry.content,
        }))
      );
    }

    // Check for companies with negative cash and mark them as INSOLVENT
    const insolventCompanyUpdates: Array<{ id: string }> = [];
    const insolvencyLogEntries: Array<{ gameId: string; content: string }> = [];

    for (const update of companyUpdates) {
      if (update.cashOnHand < 0) {
        insolventCompanyUpdates.push({ id: update.id });
        const company = companySummaries.get(update.id)?.company;
        if (company) {
          insolvencyLogEntries.push({
            gameId: phase.gameId,
            content: `${company.name} has gone insolvent with cash of $${update.cashOnHand}.`,
          });
        }
      }
    }

    // Mark companies as INSOLVENT
    if (insolventCompanyUpdates.length > 0) {
      await this.prisma.$transaction(
        insolventCompanyUpdates.map(update =>
          this.prisma.company.update({
            where: { id: update.id },
            data: { status: CompanyStatus.INSOLVENT },
          })
        )
      );

      // Log insolvency events
      if (insolvencyLogEntries.length > 0) {
        await this.gameLogService.createManyGameLogs(
          insolvencyLogEntries.map(entry => ({
            gameId: entry.gameId,
            content: entry.content,
          }))
        );
      }
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

    if (expiredCampaigns.length === 0) {
      return;
    }

    // OPTIMIZATION: Collect updates for batch processing
    const companyBrandUpdates: Array<{ id: string; brandScore: number }> = [];
    const workerIncrement = expiredCampaigns.reduce((sum, c) => sum + c.workers, 0);
    const campaignIds: string[] = [];
    const campaignGameLogEntries: Array<{ gameId: string; content: string }> = [];

    for (const campaign of expiredCampaigns) {
      // Collect brand score update
      companyBrandUpdates.push({
        id: campaign.companyId,
        brandScore: Math.max(0, campaign.Company.brandScore - campaign.brandBonus),
      });

      campaignIds.push(campaign.id);

      campaignGameLogEntries.push({
        gameId: phase.gameId,
        content: `${campaign.Company.name}'s marketing campaign expired`,
      });
    }

    // OPTIMIZATION: Batch update company brand scores
    if (companyBrandUpdates.length > 0) {
      await this.prisma.$transaction(
        companyBrandUpdates.map(update =>
          this.prisma.company.update({
            where: { id: update.id },
            data: { brandScore: update.brandScore },
          })
        )
      );
    }

    // Return all workers to pool in one update
    if (workerIncrement > 0) {
      await this.prisma.game.update({
        where: { id: phase.gameId },
        data: {
          workers: { increment: workerIncrement },
        },
      });
    }

    // OPTIMIZATION: Batch delete campaigns
    if (campaignIds.length > 0) {
      await this.prisma.marketingCampaign.deleteMany({
        where: { id: { in: campaignIds } },
      });
    }

    // OPTIMIZATION: Batch create game logs
    if (campaignGameLogEntries.length > 0) {
      await this.gameLogService.createManyGameLogs(
        campaignGameLogEntries.map(entry => ({
          gameId: entry.gameId,
          content: entry.content,
        }))
      );
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

  /**
   * Calculate and update sector demand based on base sector demand + brand scores
   * Effective Demand = base sector demand (from initialization) + sum of brand scores for all companies in sector
   * 
   * The sector's `baseDemand` field stores the initial demand from gameData (preserved).
   * The `demand` field is updated each turn to reflect effective demand (base + brand scores).
   */
  private async updateSectorDemand(phase: Phase) {
    // Query sectors with companies directly using Prisma to include Company relation
    const sectors = await this.prisma.sector.findMany({
      where: { gameId: phase.gameId },
      include: {
        Company: {
          select: { id: true, brandScore: true },
        },
      },
    });

    const sectorUpdates: Array<{ id: string; demand: number }> = [];
    const gameLogEntries: Array<{ gameId: string; content: string }> = [];

    for (const sector of sectors) {
      // Sum of brand scores for all companies in this sector
      const totalBrandScore = sector.Company.reduce(
        (sum: number, company: { id: string; brandScore: number | null }) => sum + (company.brandScore || 0),
        0
      );

      // Base demand is stored in baseDemand field (initialized from gameData)
      // If baseDemand is null/0 (for existing games), use current demand as fallback
      const baseDemand = sector.baseDemand ?? sector.demand;

      // Effective demand = base demand + brand scores
      const effectiveDemand = baseDemand + totalBrandScore;

      // Update the sector's demand field to show effective demand
      if (effectiveDemand !== sector.demand) {
        sectorUpdates.push({
          id: sector.id,
          demand: effectiveDemand,
        });

        gameLogEntries.push({
          gameId: phase.gameId,
          content: `${sector.sectorName} effective demand: ${effectiveDemand} (base: ${baseDemand} + brand: ${totalBrandScore})`,
        });
      }
    }

    // Batch update sectors
    if (sectorUpdates.length > 0) {
      await this.prisma.$transaction(
        sectorUpdates.map(update =>
          this.prisma.sector.update({
            where: { id: update.id },
            data: { demand: update.demand },
          })
        )
      );

      // Batch create game logs
      if (gameLogEntries.length > 0) {
        await this.gameLogService.createManyGameLogs(
          gameLogEntries.map(entry => ({
            gameId: entry.gameId,
            content: entry.content,
          }))
        );
      }
    }
  }

  /**
   * Distribute consumers from global pool to sectors based on economy score
   * Uses proportional distribution based on sector demand values
   */
  private async distributeConsumersToSectors(phase: Phase) {
    const [sectors, game] = await Promise.all([
      this.sectorService.sectors({
        where: { gameId: phase.gameId },
      }),
      this.prisma.game.findUnique({
        where: { id: phase.gameId },
        select: { economyScore: true, consumerPoolNumber: true },
      }),
    ]);

    if (!game) {
      throw new Error('Game not found');
    }

    // Calculate total demand across all sectors
    const totalDemand = sectors.reduce(
      (sum, sector) => sum + (sector.demand + (sector.demandBonus || 0)),
      0
    );

    if (totalDemand === 0) {
      // No demand in any sector, skip distribution
      await this.gameLogService.createGameLog({
        game: { connect: { id: phase.gameId } },
        content: 'No sector demand found. Skipping consumer distribution.',
      });
      return;
    }

    const maxConsumersToDistribute = Math.min(game.economyScore, game.consumerPoolNumber);
    const sectorUpdates: Array<{ id: string; consumers: number; proportionalShare: number }> = [];
    const gameLogEntries: Array<{ gameId: string; content: string }> = [];

    // Calculate proportional distribution for each sector
    for (const sector of sectors) {
      const sectorDemand = sector.demand + (sector.demandBonus || 0);
      if (sectorDemand === 0) continue;

      // Calculate proportional share: (sector demand / total demand) * economy score
      const proportionalShare = (sectorDemand / totalDemand) * game.economyScore;
      
      sectorUpdates.push({
        id: sector.id,
        consumers: sector.consumers,
        proportionalShare,
      });
    }

    // Sort by proportional share (descending) to handle rounding
    sectorUpdates.sort((a, b) => b.proportionalShare - a.proportionalShare);

    // Distribute consumers using largest remainder method to handle rounding
    let remainingConsumers = maxConsumersToDistribute;
    const roundedShares: Array<{ id: string; floor: number; remainder: number }> = [];

    // First pass: assign floor values
    for (const update of sectorUpdates) {
      const floor = Math.floor(update.proportionalShare);
      const remainder = update.proportionalShare - floor;
      roundedShares.push({ id: update.id, floor, remainder });
      update.consumers += floor;
      remainingConsumers -= floor;
    }

    // Second pass: distribute remaining consumers to sectors with largest remainders
    roundedShares.sort((a, b) => b.remainder - a.remainder);
    for (let i = 0; i < remainingConsumers && i < roundedShares.length; i++) {
      const share = roundedShares[i];
      const update = sectorUpdates.find(u => u.id === share.id);
      if (update) {
        update.consumers += 1;
        remainingConsumers -= 1;
      }
    }

    // Create game log entries
    for (const update of sectorUpdates) {
      const sector = sectors.find(s => s.id === update.id);
      if (!sector) continue;
      
      const sectorDemand = sector.demand + (sector.demandBonus || 0);
      const consumersAdded = update.consumers - sector.consumers;
      
      if (consumersAdded > 0) {
        gameLogEntries.push({
          gameId: phase.gameId,
          content: `${sector.sectorName} received ${consumersAdded} consumers (${((sectorDemand / totalDemand) * 100).toFixed(1)}% of economy score ${game.economyScore})`,
        });
      }
    }

    // Batch update sectors
    if (sectorUpdates.length > 0) {
      await this.prisma.$transaction(
        sectorUpdates.map(update =>
          this.prisma.sector.update({
            where: { id: update.id },
            data: { consumers: update.consumers },
          })
        )
      );
    }

    // Update game consumer pool
    const totalConsumersDistributed = sectorUpdates.reduce(
      (sum, update) => {
        const sector = sectors.find(s => s.id === update.id);
        return sum + (update.consumers - (sector?.consumers || 0));
      },
      0
    );
    
    if (totalConsumersDistributed > 0) {
      await this.prisma.game.update({
        where: { id: phase.gameId },
        data: { 
          consumerPoolNumber: Math.max(0, game.consumerPoolNumber - totalConsumersDistributed)
        },
      });
    }

    // Batch create game logs
    if (gameLogEntries.length > 0) {
      await this.gameLogService.createManyGameLogs(
        gameLogEntries.map(entry => ({
          gameId: entry.gameId,
          content: entry.content,
        }))
      );
    }
  }

  /**
   * END_TURN
   * Create a new turn after completing end-of-turn tasks
   */
  private async createNewTurn(phase: Phase) {
    // Get current turn
    const currentTurn = await this.gameTurnService.getCurrentTurn(phase.gameId);

    if (!currentTurn) {
      throw new Error('Current turn not found');
    }

    // Create a new game turn
    const newTurn = await this.gameTurnService.createGameTurn({
      game: { connect: { id: phase.gameId } },
      turn: currentTurn.turn + 1,
    });

    // Update game state with new turn
    await this.gamesService.updateGameState({
      where: { id: phase.gameId },
      data: {
        currentTurn: newTurn.id,
        currentOperatingRoundId: null,
        currentStockRoundId: null,
      },
    });
  }

  /**
   * RESOLVE_INSOLVENCY
   * Resolve insolvency contributions for companies that went negative after earnings call.
   * This phase checks all insolvent companies and updates their status based on current cash.
   * Simple logic: if cash >= 0, set to ACTIVE; if cash < 0, set to BANKRUPT.
   */
  private async handleResolveInsolvency(phase: Phase) {
    // Get all insolvent companies for this game
    const companies = await this.companyService.companies({
      where: {
        gameId: phase.gameId,
        status: CompanyStatus.INSOLVENT,
      },
    });

    if (!companies || companies.length === 0) {
      await this.gameLogService.createGameLog({
        game: { connect: { id: phase.gameId } },
        content: 'No insolvent companies found for resolution.',
      });
      return;
    }

    // Process each insolvent company
    for (const company of companies) {
      // Check current cash (which should already include contributions from resolveInsolvencyContribution)
      const currentCompany = await this.companyService.company({ id: company.id });
      if (!currentCompany) {
        continue;
      }

      // Simple logic: if cash is positive or zero, company is ACTIVE; if negative, company is BANKRUPT
      if (currentCompany.cashOnHand >= 0) {
        // Company has recovered - set to ACTIVE
        await this.companyService.updateCompany({
          where: { id: company.id },
          data: { status: CompanyStatus.ACTIVE },
        });
        await this.gameLogService.createGameLog({
          game: { connect: { id: phase.gameId } },
          content: `${company.name} has recovered from insolvency with cash of $${currentCompany.cashOnHand}.`,
        });
      } else {
        // Company is still insolvent - set to BANKRUPT
        await this.companyService.updateCompany({
          where: { id: company.id },
          data: { status: CompanyStatus.BANKRUPT },
        });
        await this.gameLogService.createGameLog({
          game: { connect: { id: phase.gameId } },
          content: `${company.name} has not recovered from insolvency (cash: $${currentCompany.cashOnHand}) and is now bankrupt.`,
        });
        // TODO: Handle share liquidation for bankrupt companies
        // This would involve:
        // 1. Getting all shares for the company
        // 2. Calculating liquidation value (BANKRUPTCY_SHARE_PERCENTAGE_RETAINED * stock price)
        // 3. Returning partial value to shareholders
        // 4. Deleting shares
      }
    }
  }
} 