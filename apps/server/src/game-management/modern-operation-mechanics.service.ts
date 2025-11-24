import { Injectable } from '@nestjs/common';
import { Phase, PhaseName, Game, Company, Resource, MarketingCampaign, FactorySize, ResourceType, ResourceTrackType, OrderType, TransactionType, EntityType, SectorName, FactoryConstructionOrder, MarketingCampaignTier, MarketingCampaignStatus, StockAction, CompanyStatus, ShareLocation, TransactionSubType, Sector, CompanyTier } from '@prisma/client';
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
import { ShareService } from '../share/share.service';
import { getResourcePriceForResourceType, getSectorResourceForSectorName, BASE_WORKER_SALARY, CompanyTierData, BANKRUPTCY_SHARE_PERCENTAGE_RETAINED, DEFAULT_SHARE_DISTRIBUTION } from '@server/data/constants';
import { PlayerPriorityService } from '@server/player-priority/player-priority.service';
import { PlayersService } from '@server/players/players.service';
import { calculateAverageStockPrice, calculateNetWorth, getRandomCompany } from '@server/data/helpers';
import { CompanyWithSector } from '@server/prisma/prisma.types';

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
    private shareService: ShareService,
  ) {}

  async handlePhase(phase: Phase, game: Game) {
    switch (phase.name) {
      case PhaseName.START_TURN:
        await this.updateResourcePrices(phase);
        await this.updateWorkforceTrack(phase);
        await this.makeFactoriesOperational(phase);
        await this.updateSectorDemand(phase);
        await this.updateSectorPriority(phase);
        await this.determinePriorityOrderBasedOnNetWorth(phase);
        await this.handleOpeningNewCompany(phase);
        break;

      case PhaseName.SHAREHOLDER_MEETING:
        await this.handleShareholderMeeting(phase);
        break;

      case PhaseName.CONSUMPTION_PHASE:
        await this.handleConsumptionPhase(phase);
        break;

      case PhaseName.FACTORY_CONSTRUCTION:
        // Players submit factory construction orders (handled by client)
        // Legacy support - kept for backward compatibility
        break;

      case PhaseName.FACTORY_CONSTRUCTION_RESOLVE:
        await this.resolveFactoryConstruction(phase);
        // Legacy support - kept for backward compatibility
        break;

      case PhaseName.MARKETING_AND_RESEARCH_ACTION:
        // Players submit marketing and research actions (handled by client)
        // Legacy support - kept for backward compatibility
        break;

      case PhaseName.MARKETING_AND_RESEARCH_ACTION_RESOLVE:
        await this.resolveMarketingAndResearchActions(phase);
        // Legacy support - kept for backward compatibility
        break;

      case PhaseName.MODERN_OPERATIONS:
        // Combined phase: Factory Construction + Marketing + Research
        // Players submit all operation orders (handled by client)
        break;

      case PhaseName.RESOLVE_MODERN_OPERATIONS:
        // Combined phase: Resolve Factory Construction + Marketing + Research
        await this.resolveModernOperations(phase);
        break;

      case PhaseName.RUSTED_FACTORY_UPGRADE:
        // Resolve rusted factories that must be upgraded
        await this.resolveRustedFactoryUpgrades(phase);
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

    // Type for company with Sector relation included
    type CompanyWithSector = Company & { Sector: Sector };
    
    // OPTIMIZATION: Batch fetch all companies at once
    const companyIds = [...new Set(factoryConstructionOrders.map(o => o.companyId))];
    const companies = await this.prisma.company.findMany({
      where: { id: { in: companyIds } },
      include: { Sector: true, Entity: true },
    });
    const companyMap = new Map<string, CompanyWithSector>(companies.map(c => [c.id, c as CompanyWithSector]));

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
      company: CompanyWithSector;
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

      // Check factory limit based on research stage (slots available)
      const existingFactories = factoryCountMap.get(company.id) || 0;
      
      // Get research stage to determine available slots
      const researchStage = this.getResearchStage(company.Sector.researchMarker || 0);
      const slotPhases = this.getSlotPhasesForResearchStage(researchStage);
      const slotsAvailable = slotPhases.length;
      
      // Max factories = number of slots available for current research stage
      const maxFactories = slotsAvailable;
      
      if (existingFactories >= maxFactories) {
        const failureReason = `Factory limit reached. Maximum factories allowed: ${maxFactories} (${slotsAvailable} slots available in Research Stage ${researchStage})`;
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

      // Get sector resource type to ensure correct factory output resource
      const sectorResourceType = this.getSectorResourceType(company.Sector.sectorName);
      
      // Determine factory output resource: use sector resource type if available, otherwise first resource
      const factoryOutputResource = sectorResourceType || order.resourceTypes[0];
      
      // Store successful operation for batch processing
      successfulOperations.push({
        order,
        company,
        blueprintCost,
        requiredWorkers,
        existingFactories,
        factoryOutputResource, // Sector resource type or first resource in blueprint
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
        
        // Get the sector's unique resource type
        const sectorResourceType = this.getSectorResourceType(op.company.Sector.sectorName);
        
        // Ensure sector resource type is always included and replace GENERAL with sector resource
        let factoryResourceTypes = [...op.order.resourceTypes];
        
        if (sectorResourceType) {
          // Remove GENERAL and any existing sector resource type (to avoid duplicates)
          factoryResourceTypes = factoryResourceTypes.filter(rt => 
            rt !== ResourceType.GENERAL && rt !== sectorResourceType
          );
          
          // Always put sector resource type first, followed by other resources
          factoryResourceTypes = [sectorResourceType, ...factoryResourceTypes];
        } else {
          // If no sector resource type, just remove GENERAL
          factoryResourceTypes = factoryResourceTypes.filter(rt => rt !== ResourceType.GENERAL);
        }
        
        await this.prisma.$transaction(async (tx) => {
          // Deduct cash from company
          await tx.company.update({
            where: { id: op.company.id },
            data: { cashOnHand: { decrement: op.blueprintCost } },
          });

          // Calculate full construction cost (base cost + resource costs)
          const baseCost = {
            [FactorySize.FACTORY_I]: 100,
            [FactorySize.FACTORY_II]: 200,
            [FactorySize.FACTORY_III]: 300,
            [FactorySize.FACTORY_IV]: 400,
          }[op.order.size];
          const fullConstructionCost = baseCost + op.blueprintCost;

          // Create factory (will be operational next turn)
          // Always ensure sector resource type is first, and replace GENERAL with sector resource
          const factory = await tx.factory.create({
            data: {
              companyId: op.company.id,
              sectorId: op.company.sectorId,
              gameId: phase.gameId,
              size: op.order.size,
              workers: op.requiredWorkers,
              slot: op.existingFactories + 1,
              isOperational: false,
              resourceTypes: factoryResourceTypes,
              originalConstructionCost: fullConstructionCost, // Store for upgrade calculations
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

  /**
   * RESOLVE_MODERN_OPERATIONS
   * Combined resolver for Factory Construction, Marketing, and Research actions
   * Processes all three action types in one phase
   */
  private async resolveModernOperations(phase: Phase) {
    // Resolve factory construction first
    await this.resolveFactoryConstruction(phase);
    
    // Then resolve marketing and research actions
    await this.resolveMarketingAndResearchActions(phase);
    
    // Update workforce track after all operations
    await this.updateWorkforceTrack(phase);
    
    // Update sector demand after workers are allocated
    await this.updateSectorDemand(phase);
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
    // Get current game state with all necessary relations
    const game = await this.prisma.game.findUnique({
      where: { id: phase.gameId },
      include: {
        factories: {
          include: {
            Sector: true,
          },
        },
        Company: {
          include: {
            marketingCampaigns: true,
            Sector: true,
          },
        },
      },
    });

    if (!game) {
      return;
    }

    // Calculate total workers in factories by sector
    const factoryWorkersBySector = new Map<string, number>();
    const totalFactoryWorkers = game.factories.reduce((sum: number, factory: any) => {
      const sectorId = factory.sectorId;
      const current = factoryWorkersBySector.get(sectorId) || 0;
      factoryWorkersBySector.set(sectorId, current + factory.workers);
      return sum + factory.workers;
    }, 0);
    
    // Calculate total workers in marketing campaigns by sector
    const marketingWorkersBySector = new Map<string, number>();
    const totalMarketingWorkers = game.Company.reduce((sum: number, company: any) => {
      const sectorId = company.sectorId;
      const marketingWorkers = company.marketingCampaigns.reduce((campaignSum: number, campaign: any) => campaignSum + campaign.workers, 0);
      if (marketingWorkers > 0) {
        const current = marketingWorkersBySector.get(sectorId) || 0;
        marketingWorkersBySector.set(sectorId, current + marketingWorkers);
      }
      return sum + marketingWorkers;
    }, 0);

    // Calculate research workers by sector (researchProgress represents allocated workers)
    // Note: researchProgress accumulates, so we use the current value as allocated workers
    const researchWorkersBySector = new Map<string, number>();
    const totalResearchWorkers = game.Company.reduce((sum: number, company: any) => {
      const sectorId = company.sectorId;
      const researchWorkers = company.researchProgress || 0;
      if (researchWorkers > 0) {
        const current = researchWorkersBySector.get(sectorId) || 0;
        researchWorkersBySector.set(sectorId, current + researchWorkers);
      }
      return sum + researchWorkers;
    }, 0);

    // Calculate total allocated workers
    const totalAllocatedWorkers = totalFactoryWorkers + totalMarketingWorkers + totalResearchWorkers;
    
    // Update available workers in game (workforcePool tracks available workers)
    const DEFAULT_WORKERS = 40; // From constants
    const availableWorkers = Math.max(0, DEFAULT_WORKERS - totalAllocatedWorkers);
    
    // Calculate economy score: represents the rightmost filled allocated square
    // Economy score = 10 + position of rightmost allocated worker
    // If 0 workers allocated, economy score is 10 (starting position before track)
    // If 5 workers allocated (positions 1-5), economy score is 10 + 5 = 15
    const economyScore = 10 + totalAllocatedWorkers;
    
    // Get current game state to check if workforcePool needs initialization
    const currentGame = await this.prisma.game.findUnique({
      where: { id: phase.gameId },
      select: { workforcePool: true },
    });
    
    // If workforcePool is 0 and we have no allocations, initialize it to DEFAULT_WORKERS
    // This handles existing games that were created before workforcePool was initialized
    const workforcePoolToSet = (currentGame?.workforcePool === 0 && totalAllocatedWorkers === 0)
      ? DEFAULT_WORKERS
      : availableWorkers;
    
    await this.prisma.game.update({
      where: { id: phase.gameId },
      data: { 
        workforcePool: workforcePoolToSet,
        workers: workforcePoolToSet, // Keep both fields in sync for backward compatibility
        economyScore: economyScore,
      },
    });

    // Store worker allocation by sector for demand calculation
    // Combine all worker allocations by sector
    const allSectorIds = new Set([
      ...Array.from(factoryWorkersBySector.keys()),
      ...Array.from(marketingWorkersBySector.keys()),
      ...Array.from(researchWorkersBySector.keys()),
    ]);

    const workerAllocationLogs: Array<{ gameId: string; content: string }> = [];
    
    for (const sectorId of allSectorIds) {
      const factoryWorkers = factoryWorkersBySector.get(sectorId) || 0;
      const marketingWorkers = marketingWorkersBySector.get(sectorId) || 0;
      const researchWorkers = researchWorkersBySector.get(sectorId) || 0;
      const totalSectorWorkers = factoryWorkers + marketingWorkers + researchWorkers;
      
      if (totalSectorWorkers > 0) {
        const sector = await this.prisma.sector.findUnique({ where: { id: sectorId } });
        if (sector) {
          workerAllocationLogs.push({
            gameId: phase.gameId,
            content: `${sector.sectorName}: ${factoryWorkers} factory + ${marketingWorkers} marketing + ${researchWorkers} research = ${totalSectorWorkers} total workers`,
          });
        }
      }
    }

    await this.gameLogService.createGameLog({
      game: { connect: { id: phase.gameId } },
      phase: { connect: { id: phase.id } },
      content: `Workforce track updated: ${totalFactoryWorkers} factory workers, ${totalMarketingWorkers} marketing workers, ${totalResearchWorkers} research workers, ${availableWorkers} available. Economy score: ${economyScore} (${totalAllocatedWorkers} allocated workers)`,
    });

    if (workerAllocationLogs.length > 0) {
      await this.gameLogService.createManyGameLogs(workerAllocationLogs);
    }
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

    /**
   * Helper function to create a company in a specific sector
   */
    private async createCompanyInSector(
      phase: Phase,
      sectorId: string,
      sectorCompanies: CompanyWithSector[],
      startingCompanyTier: CompanyTier = CompanyTier.GROWTH,
    ) {
      const sector = await this.sectorService.sector({ id: sectorId });
      if (!sector) {
        throw new Error('Sector not found');
      }
  
      const newCompanyInfo = getRandomCompany(sector.sectorName);
      const newCompany = await this.companyService.createCompany({
        Game: { connect: { id: phase.gameId } },
        Sector: { connect: { id: sectorId } },
        status: CompanyStatus.INACTIVE,
        currentStockPrice: null,
        companyTier: startingCompanyTier,
        name: newCompanyInfo.name,
        stockSymbol: newCompanyInfo.symbol,
        unitPrice: Math.floor(
          Math.random() * (sector.unitPriceMax - sector.unitPriceMin + 1) +
            sector.unitPriceMin,
        ),
        throughput: 0,
        ipoAndFloatPrice: null,
        cashOnHand: 0,
        stockTier: undefined,
        demandScore: 0,
        baseDemand: 0,
        supplyCurrent: 0,
        supplyMax: CompanyTierData[startingCompanyTier].supplyMax,
      });
  
      const shares = [];
      for (let i = 0; i < DEFAULT_SHARE_DISTRIBUTION; i++) {
        shares.push({
          price: newCompany.ipoAndFloatPrice,
          location: ShareLocation.IPO,
          companyId: newCompany.id,
          gameId: phase.gameId,
        });
      }
      await this.shareService.createManyShares(shares);
      //create stock history
      await this.stockHistoryService.createStockHistory({
        price: 0,
        action: StockAction.INITIAL,
        stepsMoved: 0,
        Company: { connect: { id: newCompany.id } },
        Game: { connect: { id: phase.gameId } },
        Phase: { connect: { id: phase.id } },
      });
  
      await this.gameLogService.createGameLog({
        game: { connect: { id: phase.gameId } },
        content: `A new company ${newCompany.name} has been established in the ${sector.sectorName} sector.`,
      });
      //add 1 base demand to the company sector
      await this.sectorService.updateSector({
        where: { id: sectorId },
        data: { demand: (sector.demand || 0) + 1 },
      });
    }
   /**
   * Every third turn, look for the sector with the highest average stock price.
   * A new company is opened in this sector. If there are zero companies active, we skip this.
   * If there are no active, inactive or insolvent companies in a sector, we open a company in that sector.
   * @param phase
   */
   async handleOpeningNewCompany(phase: Phase) {
    // Get the current game turn
    const gameTurn = await this.gameTurnService.getCurrentTurn(phase.gameId);
    if (!gameTurn) {
      throw new Error('Game turn not found');
    }

    // Get the game to check max turns
    const game = await this.gamesService.game({ id: phase.gameId });
    if (!game) {
      throw new Error('Game not found');
    }

    // If game has 10 turns or less, create a new company every 2 turns
    // Otherwise, create a new company every 3 turns
    const turnInterval = game.gameMaxTurns && game.gameMaxTurns <= 10 ? 2 : 3;
    if (gameTurn.turn % turnInterval !== 0) {
      return;
    }

    //get all sectors for the game
    const sectors = await this.sectorService.sectors({
      where: { gameId: phase.gameId },
    });
    if (!sectors) {
      throw new Error('Sectors not found');
    }

    // Get all active companies and group by sector
    const companies = await this.companyService.companiesWithSector({
      where: {
        gameId: phase.gameId,
        OR: [
          { status: CompanyStatus.ACTIVE },
          { status: CompanyStatus.INSOLVENT },
        ],
      },
    });
    if (!companies || companies.length === 0) {
      throw new Error('No active companies found');
    }

    const groupedCompanies = companies.reduce(
      (acc, company) => {
        if (!acc[company.sectorId]) {
          acc[company.sectorId] = [];
        }
        acc[company.sectorId].push(company);
        return acc;
      },
      {} as { [key: string]: CompanyWithSector[] },
    );

    //find the average stock price of each sector
    const sectorAverages = Object.entries(groupedCompanies).map(
      ([sectorId, companies]) => {
        const averageStockPrice = calculateAverageStockPrice(companies);
        return { sectorId, averageStockPrice };
      },
    );

    //find the sector with the highest average stock price
    const topSector = sectorAverages.reduce((prev, curr) => {
      return curr.averageStockPrice > prev.averageStockPrice ? curr : prev;
    });

    //create a new company in this sector
    this.createCompanyInSector(
      phase,
      topSector.sectorId,
      groupedCompanies[topSector.sectorId],
      CompanyTier.GROWTH,
    );

    //if any sectors are empty, create one company in each of those sectors
    const companiesThatArePlayableInSector =
      await this.companyService.companiesWithSector({
        where: {
          gameId: phase.gameId,
          OR: [
            { status: CompanyStatus.ACTIVE },
            { status: CompanyStatus.INACTIVE },
            { status: CompanyStatus.INSOLVENT },
          ],
        },
      });

    // Group these companies by sector
    const playableGroupedCompanies = companiesThatArePlayableInSector.reduce(
      (acc, company) => {
        if (!acc[company.sectorId]) {
          acc[company.sectorId] = [];
        }
        acc[company.sectorId].push(company);
        return acc;
      },
      {} as { [key: string]: CompanyWithSector[] },
    );

    // Check for any sectors without active, inactive, or insolvent companies
    const emptySectors = sectors.filter(
      (sector) => !playableGroupedCompanies[sector.id],
    );
    if (emptySectors.length === 0) {
      return;
    }
    // Create one company in each empty sector
    for (const emptySector of emptySectors) {
      await this.createCompanyInSector(
        phase,
        emptySector.id,
        [],
        CompanyTier.STARTUP,
      );
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

    // OPTIMIZATION: Fetch all consumption markers in parallel before processing
    const markerPromises = sectors.map(sector =>
      this.consumptionMarkerService.consumptionMarkersBySector(
        sector.id,
        phase.gameId,
      )
    );
    const allMarkers = await Promise.all(markerPromises);
    const markersBySectorId = new Map(
      sectors.map((sector, index) => [sector.id, allMarkers[index]])
    );

    for (const sector of sectors) {
      console.log('sector', sector.sectorName, 'consumers', sector.consumers);
      const customerCount = sector.consumers;
      
      if (customerCount === 0) {
        continue;
      }

      // Get all consumption markers for this sector (from pre-fetched data)
      const markers = markersBySectorId.get(sector.id) || [];

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

    // Handle research orders
    // Get all research orders from this turn
    const researchOrders = await this.prisma.researchOrder.findMany({
      where: { gameTurnId: phase.gameTurnId },
      include: {
        company: {
          include: { Sector: true },
        },
      },
    });

    // OPTIMIZATION: Collect research updates and game logs for batch processing
    const researchCompanyUpdates: Array<{
      id: string;
      researchProgress?: number;
      cashOnHand?: number;
      researchGrants?: number;
      marketFavors?: number;
      sectorId?: string;
      researchProgressGain?: number;
    }> = [];
    const researchGameLogEntries: Array<{ gameId: string; content: string }> = [];
    const researchOrderUpdates: Array<{
      id: string;
      researchProgressGain: number;
      failureReason?: string;
    }> = [];

    // Process each research order
    for (const order of researchOrders) {
      const company = order.company;
      
      // Check if company can still afford the research (cash may have changed)
      if (company.cashOnHand < order.cost) {
        // Mark order as failed
        researchOrderUpdates.push({
          id: order.id,
          researchProgressGain: 0,
          failureReason: `Insufficient funds. Required: $${order.cost}, Available: $${company.cashOnHand}`,
        });
        
        researchGameLogEntries.push({
          gameId: phase.gameId,
          content: `${company.name} research order failed: insufficient funds.`,
        });
        continue;
      }

      // Generate random research progress gain (0, 1, or 2)
      const researchProgressGain = Math.floor(Math.random() * 3); // 0, 1, or 2

      // Collect company update
      const currentProgress = company.researchProgress || 0;
      const newProgress = currentProgress + researchProgressGain;

      researchCompanyUpdates.push({
        id: company.id,
        researchProgress: newProgress,
        cashOnHand: company.cashOnHand - order.cost,
        sectorId: company.sectorId, // Include sectorId to update sector marker
        researchProgressGain, // Include gain to update sector marker
      });

      // Mark order with result
      researchOrderUpdates.push({
        id: order.id,
        researchProgressGain,
      });

      // Create game log entry
      researchGameLogEntries.push({
        gameId: phase.gameId,
        content: `${company.name} invested $${order.cost} in research. Progress: +${researchProgressGain} (Total: ${newProgress}).`,
      });
    }

    // OPTIMIZATION: Batch update research orders with results
    if (researchOrderUpdates.length > 0) {
      await this.prisma.$transaction(
        researchOrderUpdates.map(update =>
          this.prisma.researchOrder.update({
            where: { id: update.id },
            data: {
              researchProgressGain: update.researchProgressGain,
              failureReason: update.failureReason || null,
            },
          })
        )
      );
    }

    // OPTIMIZATION: Batch update companies with research results
    if (researchCompanyUpdates.length > 0) {
      await this.prisma.$transaction(
        researchCompanyUpdates.map(update => {
          const data: any = {};
          if (update.researchProgress !== undefined) data.researchProgress = update.researchProgress;
          if (update.cashOnHand !== undefined) data.cashOnHand = update.cashOnHand;
          
          return this.prisma.company.update({
            where: { id: update.id },
            data,
          });
        })
      );

      // Update sector research markers based on research progress gains
      const sectorGains = new Map<string, number>();
      researchCompanyUpdates.forEach(update => {
        if (update.sectorId && update.researchProgressGain !== undefined && update.researchProgressGain > 0) {
          const current = sectorGains.get(update.sectorId) || 0;
          sectorGains.set(update.sectorId, current + update.researchProgressGain);
        }
      });

      // Batch update sector research markers
      if (sectorGains.size > 0) {
        await this.prisma.$transaction(
          Array.from(sectorGains.entries()).map(([sectorId, gain]) =>
            this.prisma.sector.update({
              where: { id: sectorId },
              data: {
                researchMarker: {
                  increment: gain,
                },
              },
            })
          )
        );
      }
    }

    // Check for research milestones after processing all orders
    const updatedCompanies = await this.companyService.companies({
      where: {
        gameId: phase.gameId,
        id: { in: researchCompanyUpdates.map(u => u.id) },
      },
    });

    const milestoneUpdates: Array<{
      id: string;
      researchGrants?: number;
      cashOnHand?: number;
      marketFavors?: number;
    }> = [];

    for (const company of updatedCompanies) {
      // Research grants at milestones
      if (company.researchProgress === 5 && (company.researchGrants || 0) === 0) {
        milestoneUpdates.push({
          id: company.id,
          researchGrants: 1,
          cashOnHand: (company.cashOnHand || 0) + 200, // Grant money
        });

        researchGameLogEntries.push({
          gameId: phase.gameId,
          content: `${company.name} reached research milestone! Received $200 grant.`,
        });
      } else if (company.researchProgress === 10 && (company.marketFavors || 0) === 0) {
        milestoneUpdates.push({
          id: company.id,
          marketFavors: 1,
        });

        researchGameLogEntries.push({
          gameId: phase.gameId,
          content: `${company.name} reached research milestone! Received market favor (stock boost).`,
        });
      }
    }

    // Batch update milestone rewards
    if (milestoneUpdates.length > 0) {
      await this.prisma.$transaction(
        milestoneUpdates.map(update => {
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
    console.log(`[EARNINGS_CALL] Starting earnings call for game ${phase.gameId}, turn ${phase.gameTurnId}`);
    
    // Get all factory production records for this turn
    const factoryProductions = await this.factoryProductionService.factoryProductionsWithRelations({
      where: { gameTurnId: phase.gameTurnId },
    });

    console.log(`[EARNINGS_CALL] Found ${factoryProductions.length} factory production records`);

    if (factoryProductions.length === 0) {
      await this.gameLogService.createGameLog({
        game: { connect: { id: phase.gameId } },
        content: 'No factory production records found for earnings call',
      });
      return;
    }

    // OPTIMIZATION: Fetch all resources once and build price map
    const allResources = await this.resourceService.resourcesByGame(phase.gameId);
    console.log(`[EARNINGS_CALL] Found ${allResources.length} resources for game ${phase.gameId}`);
    
    const resourcePriceMap = new Map<ResourceType, number>();
    
    // Calculate all resource prices in parallel
    await Promise.all(
      allResources.map(async (resource) => {
        const price = await this.resourceService.getCurrentResourcePrice(resource);
        resourcePriceMap.set(resource.type, price);
        console.log(`[EARNINGS_CALL] Resource ${resource.type}: price = $${price} (trackPosition: ${resource.trackPosition})`);
      })
    );
    
    console.log(`[EARNINGS_CALL] Resource price map:`, Array.from(resourcePriceMap.entries()));

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
        // Debug logging for revenue calculation
        console.log(`[EARNINGS_CALL] Factory ${factory.id} resource ${resourceType}: price = $${resourcePrice}`);
      }
      
      console.log(`[EARNINGS_CALL] Factory ${factory.id} (${factory.resourceTypes.join(', ')}): revenuePerUnit = $${revenuePerUnit}, customersServed = ${production.customersServed}`);

      // Calculate actual revenue based on customers served (EXACT count from consumption phase)
      const factoryRevenue = production.customersServed * revenuePerUnit;
      
      console.log(`[EARNINGS_CALL] Factory ${factory.id} factoryRevenue = $${factoryRevenue}`);

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
    // Get current turn to determine which campaigns were created in previous turns
    const currentTurn = await this.gameTurnService.getCurrentTurn(phase.gameId);
    if (!currentTurn) {
      throw new Error('Current turn not found');
    }

    // Only degrade campaigns that were created in a turn BEFORE the current turn
    // This ensures campaigns created in the current turn remain ACTIVE for the full turn
    // Campaigns lifecycle:
    // - Created in turn N: ACTIVE for turn N and turn N+1
    // - End of turn N+1: ACTIVE → DECAYING (if gameTurnId < currentTurn.turn)
    // - End of turn N+2: DECAYING → Expired (deleted)
    // 
    // We compare turn numbers: campaigns created in turn N should degrade at end of turn N+1
    // So we degrade campaigns where (currentTurn.turn - campaign.gameTurn.turn) >= 2
    // Get all active campaigns with their turn information
    // Note: gameTurnId field will be available after Prisma migration
    const campaignsToDegrade = await this.prisma.marketingCampaign.findMany({
      where: {
        gameId: phase.gameId,
        status: MarketingCampaignStatus.ACTIVE,
      },
    }) as any[];

    if (campaignsToDegrade.length === 0) {
      // No campaigns to degrade, skip to expiring DECAYING campaigns
    } else {
      // Get turn numbers for all campaigns' gameTurnIds
      const campaignTurnIds = [...new Set(campaignsToDegrade.map(c => (c as any).gameTurnId).filter(Boolean))];
      
      if (campaignTurnIds.length === 0) {
        // No gameTurnId set yet (old campaigns before migration), skip
      } else {
        const campaignTurns = await this.prisma.gameTurn.findMany({
          where: {
            id: { in: campaignTurnIds },
          },
          select: {
            id: true,
            turn: true,
          },
        });

        // Create a map of gameTurnId -> turn number
        const turnNumberMap = new Map(campaignTurns.map(t => [t.id, t.turn]));

        // Filter campaigns that are at least 2 turns old (created in turn N, current turn is N+2 or later)
        // Campaign lifecycle: Created in turn N, active for turns N and N+1, degrade at end of turn N+1
        // So if current turn is N+2, campaigns from turn N should degrade
        const oldCampaigns = campaignsToDegrade.filter(campaign => {
          const campaignGameTurnId = (campaign as any).gameTurnId;
          if (!campaignGameTurnId) {
            // Old campaign without gameTurnId, skip (will be handled after migration)
            return false;
          }
          const campaignTurnNumber = turnNumberMap.get(campaignGameTurnId);
          if (campaignTurnNumber === undefined) {
            // If no turn info, skip (shouldn't happen, but safety check)
            return false;
          }
          const currentTurnNumber = currentTurn.turn;
          // Degrade if current turn is at least 2 turns after campaign was created
          // (turn N created, turn N+2 current means campaign had turns N and N+1 active)
          return (currentTurnNumber - campaignTurnNumber) >= 2;
        });

        if (oldCampaigns.length > 0) {
          // Move ACTIVE campaigns (from previous turns) to DECAYING
          await this.prisma.marketingCampaign.updateMany({
            where: {
              id: { in: oldCampaigns.map(c => c.id) },
            },
            data: {
              status: MarketingCampaignStatus.DECAYING,
            },
          });
        }
      }
    }


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
    // Research stages are calculated dynamically from researchMarker
    // No need to update a separate technology level field
    // Research stages: 0-5 → Stage 1, 6-10 → Stage 2, 11-15 → Stage 3, 16-20+ → Stage 4
    // This method is kept for potential future research-related updates
  }

  /**
   * Calculate and update sector demand based on base sector demand + brand scores + worker allocation (divided by 2) + research stage bonus
   * Effective Demand = base sector demand + sum of brand scores + (worker allocation / 2) + research stage bonus
   * 
   * Worker allocation = total workers in factories + marketing campaigns + research for that sector
   * Worker allocation is divided by 2 before being added to demand.
   * Research stage bonus:
   *   - Stage 1 (researchMarker 0-5): +0
   *   - Stage 2 (researchMarker 6-10): +2
   *   - Stage 3 (researchMarker 11-15): +3
   *   - Stage 4 (researchMarker 16-20): +5
   * 
   * The sector's `baseDemand` field stores the initial demand from gameData (preserved).
   * The `demand` field is updated each turn to reflect effective demand (base + brand + workers/2 + research stage).
   */
  private async updateSectorDemand(phase: Phase) {
    // Query sectors with companies directly using Prisma to include Company relation
    const sectors = await this.prisma.sector.findMany({
      where: { gameId: phase.gameId },
      include: {
        Company: {
          select: { id: true, brandScore: true, researchProgress: true },
        },
      },
    });

    // Get all factories and marketing campaigns grouped by sector
    const factories = await this.prisma.factory.findMany({
      where: { gameId: phase.gameId },
      select: { sectorId: true, workers: true },
    });

    const marketingCampaigns = await this.prisma.marketingCampaign.findMany({
      where: { 
        gameId: phase.gameId,
        status: MarketingCampaignStatus.ACTIVE,
      },
      include: {
        Company: {
          select: { sectorId: true },
        },
      },
    });

    // Calculate worker allocation by sector
    const workerAllocationBySector = new Map<string, number>();
    
    // Add factory workers
    for (const factory of factories) {
      const current = workerAllocationBySector.get(factory.sectorId) || 0;
      workerAllocationBySector.set(factory.sectorId, current + factory.workers);
    }
    
    // Add marketing campaign workers
    for (const campaign of marketingCampaigns) {
      const sectorId = campaign.Company.sectorId;
      const current = workerAllocationBySector.get(sectorId) || 0;
      workerAllocationBySector.set(sectorId, current + campaign.workers);
    }
    
    // Add research workers from ResearchOrder records
    // Each research order requires workers - count ALL research orders in the game
    // Research orders allocate workers when created and remain allocated (they don't get deleted after resolution)
    const researchOrders = await this.prisma.researchOrder.findMany({
      where: {
        gameId: phase.gameId,
        // Count all research orders - workers remain allocated throughout the game
      },
      include: {
        company: {
          select: { sectorId: true },
        },
      },
    });

    // Count research workers by sector (each research order = 1 worker)
    for (const order of researchOrders) {
      const sectorId = order.company.sectorId;
      const current = workerAllocationBySector.get(sectorId) || 0;
      workerAllocationBySector.set(sectorId, current + 1); // Each research order = 1 worker
    }

    const sectorUpdates: Array<{ id: string; demand: number }> = [];
    const gameLogEntries: Array<{ gameId: string; content: string }> = [];

    for (const sector of sectors) {
      // Sum of brand scores for all companies in this sector
      const totalBrandScore = sector.Company.reduce(
        (sum: number, company: { id: string; brandScore: number | null }) => sum + (company.brandScore || 0),
        0
      );

      // Worker allocation for this sector
      const workerAllocation = workerAllocationBySector.get(sector.id) || 0;

      // Calculate research stage bonus based on sector researchMarker
      // Stage 1 (0-5): +0, Stage 2 (6-10): +2, Stage 3 (11-15): +3, Stage 4 (16-20): +5
      const researchMarker = sector.researchMarker || 0;
      const researchStage = Math.min(Math.floor(researchMarker / 5) + 1, 4);
      const researchStageBonus = researchStage === 1 ? 0 : researchStage === 2 ? 2 : researchStage === 3 ? 3 : 5;

      // Base demand should be 0 for modern operations - demand comes from workers + brand bonus + research stage only
      // If baseDemand exists but is > 0, it's from old gameData and should be ignored
      const baseDemand = 0; // No base demand - all demand comes from worker allocation + brand bonus + research stage

      // Worker allocation contribution: divide by 2 and round down (no decimals allowed)
      // Math.floor ensures we always round down: 19/2 = 9, 20/2 = 10, 21/2 = 10
      const workerAllocationContribution = Math.floor(workerAllocation / 2);

      // Effective demand = base demand + brand scores + (worker allocation / 2, rounded down) + research stage bonus
      const effectiveDemand = baseDemand + totalBrandScore + workerAllocationContribution + researchStageBonus;

      // Update the sector's demand field to show effective demand
      if (effectiveDemand !== sector.demand) {
        sectorUpdates.push({
          id: sector.id,
          demand: effectiveDemand,
        });

        gameLogEntries.push({
          gameId: phase.gameId,
          content: `${sector.sectorName} effective demand: ${effectiveDemand} (base: ${baseDemand} + brand: ${totalBrandScore} + workers: ${workerAllocation}/2=${workerAllocationContribution} + research stage ${researchStage}: +${researchStageBonus})`,
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
   * Calculate and update sector priority based on demand (inversed), with tie-breakers:
   * 1. Lower demand = higher priority (inversed)
   * 2. Tie-breaker 1: Lower average stock value = higher priority
   * 3. Tie-breaker 2: Fewer companies = higher priority
   * 4. Final tie-breaker: Random
   */
  private async updateSectorPriority(phase: Phase) {
    // Get all sectors with their demand values
    const sectors = await this.prisma.sector.findMany({
      where: { gameId: phase.gameId },
      select: {
        id: true,
        sectorName: true,
        demand: true,
      },
    });

    // Get all companies with their stock prices, grouped by sector
    const companies = await this.prisma.company.findMany({
      where: {
        gameId: phase.gameId,
        status: { in: [CompanyStatus.ACTIVE, CompanyStatus.INSOLVENT] },
      },
      select: {
        id: true,
        sectorId: true,
        currentStockPrice: true,
      },
    });

    // Calculate average stock price and company count per sector
    const sectorData = new Map<string, {
      sectorId: string;
      sectorName: string;
      demand: number;
      averageStockPrice: number;
      companyCount: number;
    }>();

    for (const sector of sectors) {
      const sectorCompanies = companies.filter(c => c.sectorId === sector.id);
      const companyCount = sectorCompanies.length;
      const averageStockPrice = companyCount > 0
        ? sectorCompanies.reduce((sum, c) => sum + (c.currentStockPrice || 0), 0) / companyCount
        : 0;

      sectorData.set(sector.id, {
        sectorId: sector.id,
        sectorName: sector.sectorName,
        demand: sector.demand || 0,
        averageStockPrice,
        companyCount,
      });
    }

    // Sort sectors by priority criteria
    const sortedSectors = Array.from(sectorData.values()).sort((a, b) => {
      // Primary: Lower demand = higher priority (inversed)
      if (a.demand !== b.demand) {
        return a.demand - b.demand;
      }

      // Tie-breaker 1: Lower average stock value = higher priority
      if (a.averageStockPrice !== b.averageStockPrice) {
        return a.averageStockPrice - b.averageStockPrice;
      }

      // Tie-breaker 2: Fewer companies = higher priority
      if (a.companyCount !== b.companyCount) {
        return a.companyCount - b.companyCount;
      }

      // Final tie-breaker: Random (use sector ID as seed for consistent randomness)
      // This ensures the same sectors always get the same random order within a tie
      return a.sectorId.localeCompare(b.sectorId);
    });

    // Get existing sector priorities
    const existingPriorities = await this.prisma.sectorPriority.findMany({
      where: { gameId: phase.gameId },
    });

    const existingPriorityMap = new Map(
      existingPriorities.map(sp => [sp.sectorId, sp.id])
    );

    // Update or create sector priorities
    await Promise.all(
      sortedSectors.map(async (sector, index) => {
        const priority = index + 1; // Lower number = higher priority
        const existingId = existingPriorityMap.get(sector.sectorId);

        if (existingId) {
          // Update existing priority
          await this.prisma.sectorPriority.update({
            where: { id: existingId },
            data: { priority },
          });
        } else {
          // Create new priority
          await this.prisma.sectorPriority.create({
            data: {
              gameId: phase.gameId,
              sectorId: sector.sectorId,
              priority,
            },
          });
        }
      })
    );

    // Log the priority order
    await this.gameLogService.createGameLog({
      game: { connect: { id: phase.gameId } },
      content: `Sector priority updated: ${sortedSectors.map((s, i) => `${i + 1}. ${s.sectorName} (demand: ${s.demand}, avg stock: $${s.averageStockPrice.toFixed(0)}, companies: ${s.companyCount})`).join(', ')}`,
    });
  }

  /**
   * Calculate slot phases based on research stage
   * Stage 1: I, I, I
   * Stage 2: I/II, I/II, II
   * Stage 3: II, II, II/III, III
   * Stage 4: III, III/IV, IV
   */
  private getSlotPhasesForResearchStage(stage: number): Array<{ min: FactorySize; max: FactorySize }> {
    switch (stage) {
      case 1:
        return [
          { min: FactorySize.FACTORY_I, max: FactorySize.FACTORY_I },
          { min: FactorySize.FACTORY_I, max: FactorySize.FACTORY_I },
          { min: FactorySize.FACTORY_I, max: FactorySize.FACTORY_I },
        ];
      case 2:
        return [
          { min: FactorySize.FACTORY_I, max: FactorySize.FACTORY_II },
          { min: FactorySize.FACTORY_I, max: FactorySize.FACTORY_II },
          { min: FactorySize.FACTORY_II, max: FactorySize.FACTORY_II },
        ];
      case 3:
        return [
          { min: FactorySize.FACTORY_II, max: FactorySize.FACTORY_II },
          { min: FactorySize.FACTORY_II, max: FactorySize.FACTORY_II },
          { min: FactorySize.FACTORY_II, max: FactorySize.FACTORY_III },
          { min: FactorySize.FACTORY_III, max: FactorySize.FACTORY_III },
        ];
      case 4:
        return [
          { min: FactorySize.FACTORY_III, max: FactorySize.FACTORY_III },
          { min: FactorySize.FACTORY_III, max: FactorySize.FACTORY_IV },
          { min: FactorySize.FACTORY_IV, max: FactorySize.FACTORY_IV },
        ];
      default:
        // Default to stage 1
        return [
          { min: FactorySize.FACTORY_I, max: FactorySize.FACTORY_I },
          { min: FactorySize.FACTORY_I, max: FactorySize.FACTORY_I },
          { min: FactorySize.FACTORY_I, max: FactorySize.FACTORY_I },
        ];
    }
  }

  /**
   * Get research stage from sector researchMarker
   * Stage 1: 0-5, Stage 2: 6-10, Stage 3: 11-15, Stage 4: 16-20
   */
  private getResearchStage(researchMarker: number): number {
    if (researchMarker >= 16) return 4;
    if (researchMarker >= 11) return 3;
    if (researchMarker >= 6) return 2;
    return 1;
  }

  /**
   * Check if a factory size is supported by a slot phase
   */
  private isFactorySizeSupported(factorySize: FactorySize, slotPhase: { min: FactorySize; max: FactorySize }): boolean {
    const sizeOrder = {
      [FactorySize.FACTORY_I]: 1,
      [FactorySize.FACTORY_II]: 2,
      [FactorySize.FACTORY_III]: 3,
      [FactorySize.FACTORY_IV]: 4,
    };
    const factoryOrder = sizeOrder[factorySize];
    const minOrder = sizeOrder[slotPhase.min];
    const maxOrder = sizeOrder[slotPhase.max];
    return factoryOrder >= minOrder && factoryOrder <= maxOrder;
  }

  /**
   * Detect and mark rusted factories based on current research stage
   */
  private async detectRustedFactories(phase: Phase) {
    // Get all sectors with their research markers
    const sectors = await this.prisma.sector.findMany({
      where: { gameId: phase.gameId },
      select: {
        id: true,
        sectorName: true,
        researchMarker: true,
      },
    });

    // Get all factories
    const factories = await this.prisma.factory.findMany({
      where: {
        gameId: phase.gameId,
        isOperational: true, // Only check operational factories
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    const rustedFactories: string[] = [];
    const factoryUpdates: Array<{ id: string; isRusted: boolean }> = [];

    for (const factory of factories) {
      const sector = sectors.find(s => s.id === factory.sectorId);
      if (!sector) continue;

      const researchStage = this.getResearchStage(sector.researchMarker || 0);
      const slotPhases = this.getSlotPhasesForResearchStage(researchStage);
      
      // Get the slot phase for this factory's slot (slots are 1-indexed)
      const slotIndex = factory.slot - 1;
      if (slotIndex < 0 || slotIndex >= slotPhases.length) {
        // Slot doesn't exist for this stage, factory is rusted
        rustedFactories.push(factory.id);
        factoryUpdates.push({ id: factory.id, isRusted: true });
        continue;
      }

      const slotPhase = slotPhases[slotIndex];
      const isSupported = this.isFactorySizeSupported(factory.size, slotPhase);

      if (!isSupported) {
        rustedFactories.push(factory.id);
        factoryUpdates.push({ id: factory.id, isRusted: true });
      } else if (factory.isRusted) {
        // Factory is no longer rusted
        factoryUpdates.push({ id: factory.id, isRusted: false });
      }
    }

    // Update factory rusted status
    if (factoryUpdates.length > 0) {
      await Promise.all(
        factoryUpdates.map(update =>
          this.prisma.factory.update({
            where: { id: update.id },
            data: { isRusted: update.isRusted },
          })
        )
      );
    }

    // Log rusted factories
    if (rustedFactories.length > 0) {
      const rustedFactoryDetails = factories
        .filter(f => rustedFactories.includes(f.id))
        .map(f => `${f.company.name} - ${f.size} (Slot ${f.slot})`);
      
      await this.gameLogService.createGameLog({
        game: { connect: { id: phase.gameId } },
        content: `Rusted factories detected: ${rustedFactoryDetails.join(', ')}. These must be upgraded.`,
      });
    }

    return rustedFactories;
  }

  /**
   * Resolve rusted factory upgrades
   * Companies must upgrade rusted factories or go into insolvency
   */
  private async resolveRustedFactoryUpgrades(phase: Phase) {
    // First, detect rusted factories
    const rustedFactoryIds = await this.detectRustedFactories(phase);

    if (rustedFactoryIds.length === 0) {
      await this.gameLogService.createGameLog({
        game: { connect: { id: phase.gameId } },
        content: 'No rusted factories detected. All factories are up to date.',
      });
      return;
    }

    // Get rusted factories with their companies and sectors
    const rustedFactories = await this.prisma.factory.findMany({
      where: {
        id: { in: rustedFactoryIds },
      },
      include: {
        company: true,
        Sector: {
          select: {
            id: true,
            sectorName: true,
            researchMarker: true,
          },
        },
      },
    });

    // Group by company to handle all upgrades for a company together
    const factoriesByCompany = new Map<string, typeof rustedFactories>();
    for (const factory of rustedFactories) {
      if (!factoriesByCompany.has(factory.companyId)) {
        factoriesByCompany.set(factory.companyId, []);
      }
      factoriesByCompany.get(factory.companyId)!.push(factory);
    }

    // Process each company's rusted factories
    for (const [companyId, companyFactories] of factoriesByCompany.entries()) {
      const company = companyFactories[0].company;
      const sector = companyFactories[0].Sector;
      const researchStage = this.getResearchStage(sector.researchMarker || 0);
      const slotPhases = this.getSlotPhasesForResearchStage(researchStage);

      let totalUpgradeCost = 0;
      const upgrades: Array<{
        factory: typeof rustedFactories[0];
        newSize: FactorySize;
        upgradeCost: number;
      }> = [];

      // OPTIMIZATION: Collect all required resource types first, then fetch prices in one query
      const allRequiredResourceTypes = new Set<ResourceType>();
      const factoryUpgradeData: Array<{
        factory: typeof rustedFactories[0];
        newSize: FactorySize;
        requiredResources: RequiredResource[];
      }> = [];

      // First pass: determine new sizes and collect resource types
      for (const factory of companyFactories) {
        const slotIndex = factory.slot - 1;
        if (slotIndex < 0 || slotIndex >= slotPhases.length) {
          continue;
        }

        const slotPhase = slotPhases[slotIndex];
        const currentSizeOrder = {
          [FactorySize.FACTORY_I]: 1,
          [FactorySize.FACTORY_II]: 2,
          [FactorySize.FACTORY_III]: 3,
          [FactorySize.FACTORY_IV]: 4,
        }[factory.size];

        const minSizeOrder = {
          [FactorySize.FACTORY_I]: 1,
          [FactorySize.FACTORY_II]: 2,
          [FactorySize.FACTORY_III]: 3,
          [FactorySize.FACTORY_IV]: 4,
        }[slotPhase.min];

        const maxSizeOrder = {
          [FactorySize.FACTORY_I]: 1,
          [FactorySize.FACTORY_II]: 2,
          [FactorySize.FACTORY_III]: 3,
          [FactorySize.FACTORY_IV]: 4,
        }[slotPhase.max];

        let newSize: FactorySize;
        if (currentSizeOrder >= minSizeOrder && currentSizeOrder <= maxSizeOrder) {
          newSize = factory.size;
        } else {
          newSize = slotPhase.min;
        }

        const requiredResources = await this.getRequiredResourcesForFactory(newSize, sector.sectorName);
        requiredResources.forEach(r => allRequiredResourceTypes.add(r.type));
        factoryUpgradeData.push({ factory, newSize, requiredResources });
      }

      // OPTIMIZATION: Fetch all resource prices in one query
      const currentResourcePrices = allRequiredResourceTypes.size > 0
        ? await this.prisma.resource.findMany({
            where: {
              gameId: phase.gameId,
              type: { in: Array.from(allRequiredResourceTypes) },
            },
          })
        : [];

      const resourcePriceMap = new Map(
        currentResourcePrices.map(r => [r.type, r.price])
      );

      // Second pass: calculate upgrade costs using cached resource prices
      for (const { factory, newSize, requiredResources } of factoryUpgradeData) {
        const originalCost = factory.originalConstructionCost || 0;
        const refundAmount = Math.floor(originalCost * 0.5);

        // Calculate resource cost using cached prices
        const resourceCost = requiredResources.reduce((sum, req) => {
          const price = resourcePriceMap.get(req.type) || 0;
          return sum + price * req.quantity;
        }, 0);

        const baseCost = {
          [FactorySize.FACTORY_I]: 100,
          [FactorySize.FACTORY_II]: 200,
          [FactorySize.FACTORY_III]: 300,
          [FactorySize.FACTORY_IV]: 400,
        }[newSize];

        const fullBlueprintCost = baseCost + resourceCost;
        const upgradeCost = fullBlueprintCost - refundAmount;

        totalUpgradeCost += upgradeCost;
        upgrades.push({
          factory,
          newSize,
          upgradeCost,
        });
      }

      // Check if company can afford upgrades
      if (company.cashOnHand < totalUpgradeCost) {
        // Company cannot afford upgrades - go into insolvency
        await this.companyService.updateCompany({
          where: { id: company.id },
          data: { status: CompanyStatus.INSOLVENT },
        });

        await this.gameLogService.createGameLog({
          game: { connect: { id: phase.gameId } },
          content: `${company.name} cannot afford to upgrade ${companyFactories.length} rusted factory/factories (cost: $${totalUpgradeCost}, cash: $${company.cashOnHand}). Company is now INSOLVENT.`,
        });

        continue;
      }

      // Company can afford upgrades - perform them
      // OPTIMIZATION: Deduct total upgrade cost once instead of per factory
      await this.companyService.updateCompany({
        where: { id: company.id },
        data: { cashOnHand: { decrement: totalUpgradeCost } },
      });

      // OPTIMIZATION: Batch update all factories
      const factoryUpdates = upgrades.map(({ factory, newSize }) => ({
        where: { id: factory.id },
        data: {
          size: newSize,
          isRusted: false,
          originalConstructionCost: upgrades.find(u => u.factory.id === factory.id)!.upgradeCost + Math.floor((factory.originalConstructionCost || 0) * 0.5),
          workers: {
            [FactorySize.FACTORY_I]: 2,
            [FactorySize.FACTORY_II]: 4,
            [FactorySize.FACTORY_III]: 6,
            [FactorySize.FACTORY_IV]: 8,
          }[newSize],
        },
      }));

      // Batch update factories in a transaction
      await this.prisma.$transaction(
        factoryUpdates.map(update => this.prisma.factory.update(update))
      );

      // OPTIMIZATION: Batch create game logs
      const gameLogEntries = upgrades.map(({ factory, newSize, upgradeCost }) => ({
        gameId: phase.gameId,
        content: `${company.name} upgraded factory in slot ${factory.slot} from ${factory.size} to ${newSize} for $${upgradeCost}.`,
      }));

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