import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { PlayersService } from '@server/players/players.service';
import {
  Company,
  Game,
  OperatingRound,
  OperatingRoundAction,
  OrderStatus,
  OrderType,
  Phase,
  PhaseName,
  Player,
  Prisma,
  RevenueDistribution,
  RevenueDistributionVote,
  RoundType,
  Sector,
  ShareLocation,
  StockRound,
  CompanyStatus,
  StockAction,
  CompanyAction,
  CompanyTier,
  Share,
  PrestigeReward,
  PrestigeRewards,
  ResearchCardEffect,
  PlayerOrder,
  DistributionStrategy,
  InfluenceRound,
  PlayerPriority,
  SectorName,
  ContractState,
  OptionContract,
  GameStatus,
  TransactionType,
  EntityType,
  TransactionSubType,
  InsolvencyContribution,
  Prize,
  SectorPrize,
  PrizeVote,
  PrizeDistributionType,
  Card,
  Transaction,
  HeadlineLocation,
  Headline,
  HeadlineType,
  StockSubRound,
  AwardTrackType,
  GameTurn,
  CompanyIpoPriceVote,
  OperationMechanicsVersion,
  ResourceType,
  ResourceTrackType,
} from '@prisma/client';
import { GamesService } from '@server/games/games.service';
import { CompanyService } from '@server/company/company.service';
import { SectorService } from '@server/sector/sector.service';
import { FactoryProductionService } from '@server/factory-production/factory-production.service';
import { gameDataJson } from '@server/data/gameData';
import { StartGameInput } from './game-management.interface';
import {
  CompanyActionWithCompany,
  CompanyWithCompanyActions,
  CompanyWithRelations,
  CompanyWithSector,
  GameState,
  GameTurnWithRelations,
  HeadlineWithRelations,
  OptionContractWithRelations,
  PlayerOrderWithCompany,
  PlayerOrderWithPlayerCompany,
  PlayerOrderWithPlayerCompanySectorShortOrder,
  PlayerWithShares,
  PrizeVoteWithRelations,
  PrizeWithSectorPrizes,
  ProductionResultWithCompany,
  SectorWithCompanies,
  SectorWithCompanyRelations,
  ShareWithCompany,
  ShortOrderWithShares,
} from '@server/prisma/prisma.types';
import { StockRoundService } from '@server/stock-round/stock-round.service';
import { PhaseService } from '@server/phase/phase.service';
import {
  DEFAULT_SHARE_DISTRIBUTION,
  MAX_LIMIT_ORDER_ACTIONS,
  MAX_MARKET_ORDER_ACTIONS,
  MAX_SHORT_ORDER_ACTIONS,
  stockTierChartRanges,
  phaseTimes,
  StockTierChartRange,
  interestRatesByTerm,
  BORROW_RATE,
  companyVoteActionPriority,
  throughputRewardOrPenalty,
  ThroughputRewardType,
  getStockPriceWithStepsDown,
  getStockPriceStepsUp,
  STABLE_ECONOMY_SCORE,
  CompanyActionCosts,
  CompanyTierData,
  CapitalGainsTiers,
  getNextCompanyTier,
  getPreviousCompanyTier,
  DEFAULT_SHARE_LIMIT,
  MAX_SHARE_PERCENTAGE,
  DEFAULT_INCREASE_UNIT_PRICE,
  GOVERNMENT_GRANT_AMOUNT,
  PRESTIGE_ACTION_TOKEN_COST,
  MARKETING_CONSUMER_BONUS,
  DEFAULT_INFLUENCE,
  OPTION_CONTRACT_ACTIVE_COUNT,
  OPTION_CONTRACT_MIN_TERM,
  OPTION_CONTRACT_MAX_TERM,
  sectorVolatility,
  LOAN_AMOUNT,
  LOAN_INTEREST_RATE,
  getNextCompanyOperatingRoundTurn,
  PRESTIGE_EFFECT_INCREASE_AMOUNT,
  AUTOMATION_EFFECT_OPERATIONS_REDUCTION,
  MARGIN_ACCOUNT_ID_PREFIX,
  CAPITAL_INJECTION_STARTER,
  LARGE_MARKETING_CAMPAIGN_DEMAND,
  SMALL_MARKETING_CAMPAIGN_DEMAND,
  CAPITAL_INJECTION_BOOSTER,
  StartingTier,
  CORPORATE_ESPIONAGE_PRESTIGE_REDUCTION,
  sectorPriority,
  LOBBY_DEMAND_BOOST,
  ACTION_ISSUE_SHARE_AMOUNT,
  BANKRUPTCY_SHARE_PERCENTAGE_RETAINED,
  OURSOURCE_SUPPLY_BONUS,
  PRETIGE_REWARD_OPERATION_COST_PERCENTAGE_REDUCTION,
  CompanyActionPrestigeCosts,
  INSOLVENT_EXTRA_PHASE_TIME,
  PlayerReadiness,
  STRATEGIC_RESERVE_REVENUE_MULTIPLIER_PERCENTAGE,
  SURGE_PRICING_REVENUE_MULTIPLIER_PERCENTAGE,
  STEADY_DEMAND_CONSUMER_BONUS,
  PRIZE_FREEZE_AMOUNT,
  FASTTRACK_APPROVAL_AMOUNT_CONSUMERS,
  FASTTRACK_APPROVAL_AMOUNT_DEMAND,
  INNOVATION_SURGE_CARD_DRAW_BONUS,
  companyActionsDescription,
  LICENSING_AGREEMENT_UNIT_PRICE_BONUS,
  DEFAULT_SECTOR_AMOUNT,
  PRIZE_CASH_SUM,
  INACTIVE_COMPANY_PER_TURN_DISCOUNT,
  OUTSOURCE_PRESTIGE_PENALTY,
  AWARD_PRESTIGE_BONUS,
  stockGridPrices,
  RESOURCE_PRICES_CIRCLE,
  RESOURCE_PRICES_SQUARE,
  RESOURCE_PRICES_TRIANGLE,
  getSectorResourceForSectorName,
  getResourcePriceForResourceType,
  DEFAULT_WORKERS,
} from '@server/data/constants';
import { TimerService } from '@server/timer/timer.service';
import {
  calculateCertLimitForPlayerCount,
  calculateCompanySupply,
  calculateDemand,
  calculateMarginAccountMinimum,
  calculateNetWorth,
  calculateStepsAndRemainder,
  getStepsWithMaxBeingTheNextTierMin,
  companyPriorityOrderOperations,
  createPrestigeTrackBasedOnSeed,
  createSeededResearchCards,
  determineFloatPrice,
  determineNextGamePhase,
  determineStockTier,
  getCurrentTierBySharePrice,
  getNextPrestigeInt,
  getNextTier,
  getRandomCompany,
  calculateAverageStockPrice,
  calculateStartingCompanyCount,
  getCompanyActionCost,
  sortSectorIdsByPriority,
  getPassiveEffectForSector,
} from '@server/data/helpers';
import { PusherService } from 'nestjs-pusher';
import {
  EVENT_GAME_ENDED,
  EVENT_NEW_PHASE,
  EVENT_PLAYER_READINESS_CHANGED,
  getGameChannelId,
} from '@server/pusher/pusher.types';
import { OperatingRoundService } from '@server/operating-round/operating-round.service';
import { ShareService } from '@server/share/share.service';
import { PlayerOrderService } from '@server/player-order/player-order.service';
import e from 'express';
import { StockHistoryService } from '@server/stock-history/stock-history.service';
import { ProductionResultService } from '@server/production-result/production-result.service';
import {
  CompanyActionService,
  CompanyActionUpdate,
} from '@server/company-action/company-action.service';
import { GameLogService } from '@server/game-log/game-log.service';
import { CapitalGainsService } from '@server/capital-gains/capital-gains.service';
import { GameTurnService } from '@server/game-turn/game-turn.service';
import { PrestigeRewardsService } from '@server/prestige-rewards/prestige-rewards.service';
import { ResearchDeckService } from '@server/research-deck/research-deck.service';
import { CardsService } from '@server/cards/cards.service';
import { InfluenceRoundVotesService } from '@server/influence-round-votes/influence-round-votes.service';
import { InfluenceRoundService } from '@server/influence-round/influence-round.service';
import { PlayerPriorityService } from '@server/player-priority/player-priority.service';
import { number, string } from 'zod';
import { OptionContractService } from '@server/option-contract/option-contract.service';
import { cp } from 'fs';
import { ShortOrderService } from '@server/short-order/short-order.service';
import { GameRecordService } from '@server/game-record/game-record.service';
import { PlayerResultService } from '@server/player-result/player-result.service';
import { UsersService } from '@server/users/users.service';
import { TransactionService } from '@server/transaction/transaction.service';
import { InsolvencyContributionService } from '@server/insolvency-contribution/insolvency-contribution.service';
import { time } from 'console';
import { PrizeService } from '@server/prize/prize.service';
import { PrizeVotesService } from '@server/prize-votes/prize-votes.service';
import { PrizeDistributionService } from '@server/prize-distribution/prize-distribution.service';
import { RoomUserService } from '@server/room-user/room-user.service';
import { CompanyActionOrderService } from '@server/company-action-order/company-action-order.service';
import { HeadlineService } from '@server/headline/headline.service';
import { generateHeadlines } from '@server/headline/headline.helpers';
import { StockSubRoundService } from '@server/stock-sub-round/stock-sub-round.service';
import { CompanyAwardTrackService } from '@server/company-award-track/company-award-track.service';
import { CompanyAwardTrackSpaceService } from '@server/company-award-track-space/company-award-track-space.service';
import {
  adjectives,
  animals,
  colors,
  uniqueNamesGenerator,
} from 'unique-names-generator';
import { randomUUID } from 'crypto';
import { AiBotService } from '@server/ai-bot/ai-bot.service';
import { RevenueDistributionVoteService } from '@server/revenue-distribution-vote/revenue-distribution-vote.service';
import { OperatingRoundVoteService } from '@server/operating-round-vote/operating-round-vote.service';
import { ModernOperationMechanicsService } from './modern-operation-mechanics.service';
import { ResourceService } from '@server/resource/resource.service';
import { ForecastService } from '@server/forecast/forecast.service';

type GroupedByPhase = {
  [key: string]: {
    phase: Phase;
    orders: PlayerOrderWithPlayerCompany[];
  };
};

interface ShareUpdate {
  companyId: string;
  where: { id: { in: string[] } };
  data: { location: ShareLocation; playerId: string };
}

@Injectable()
export class GameManagementService {
  private readinessStore: Record<string, PlayerReadiness[]> = {};
  private gameCache = new Map<
    string,
    {
      currentGameTurn?: GameTurn | null;
      currentGameTurnId?: string;
      players?: Player[];
    }
  >();
  constructor(
    private prisma: PrismaService,
    private playersService: PlayersService,
    private gamesService: GamesService,
    private companyService: CompanyService,
    private sectorService: SectorService,
    private stockRoundService: StockRoundService,
    private operatingRoundService: OperatingRoundService,
    private phaseService: PhaseService,
    private timerService: TimerService,
    private pusherService: PusherService,
    private shareService: ShareService,
    private playerOrderService: PlayerOrderService,
    private stockHistoryService: StockHistoryService,
    private productionResultService: ProductionResultService,
    private companyActionService: CompanyActionService,
    private gameLogService: GameLogService,
    private capitalGainsService: CapitalGainsService,
    private gameTurnService: GameTurnService,
    private prestigeRewardService: PrestigeRewardsService,
    private researchDeckService: ResearchDeckService,
    private cardsService: CardsService,
    private playerPriorityService: PlayerPriorityService,
    private influenceRoundService: InfluenceRoundService,
    private influenceRoundVotes: InfluenceRoundVotesService,
    private optionContractService: OptionContractService,
    private shortOrdersService: ShortOrderService,
    private gameRecordService: GameRecordService,
    private playerResultService: PlayerResultService,
    private usersService: UsersService,
    private transactionService: TransactionService,
    private insolvencyContributionService: InsolvencyContributionService,
    private prizeService: PrizeService,
    private prizeVoteService: PrizeVotesService,
    private prizeDistributionService: PrizeDistributionService,
    private roomUserService: RoomUserService,
    private companyActionOrderService: CompanyActionOrderService,
    private headlineService: HeadlineService,
    private stockSubRoundService: StockSubRoundService,
    private companyAwardTrackService: CompanyAwardTrackService,
    private companyAwardTrackSpaceService: CompanyAwardTrackSpaceService,
    private aiBotService: AiBotService,
    private revenueDistributionVoteService: RevenueDistributionVoteService,
    private operatingRoundVoteService: OperatingRoundVoteService,
    private modernOperationMechanicsService: ModernOperationMechanicsService,
    private resourceService: ResourceService,
    private factoryProductionService: FactoryProductionService,
    private forecastService: ForecastService,
  ) {}

  /**
   * Main function to handle phase resolution.
   * This triggers any business logic functions dealing with game upkeep,
   * carrying out automated actions of the game according to rules.
   *
   * Anytime the players need to observe some result of their action, this is
   * where the game performs this logic.
   *
   * @param phase
   * @returns
   */
  async handlePhase(phase: Phase, game: Game) {
    // If game is using modern operation mechanics, try to handle it with the modern service
    if (game.operationMechanicsVersion === OperationMechanicsVersion.MODERN) {
      const handled = await this.modernOperationMechanicsService.handlePhase(
        phase,
        game,
      );
      // If the modern service handled the phase, check if we need to auto-transition
      if (handled) {
        // Auto-transition FORECAST_RESOLVE after completion (timerless games)
        if (phase.name === PhaseName.FORECAST_RESOLVE && game.isTimerless) {
          await this.handlePhaseTransition({
            phase,
            gameId: phase.gameId,
          });
        }
        return;
      }
      // Otherwise, fall through to legacy handling
    }

    // Legacy phase handling
    switch (phase.name) {
      case PhaseName.START_TURN:
        const gameCache = this.gameCache.get(game.id);
        this.gameCache.set(game.id, {
          ...gameCache,
          currentGameTurnId: phase.gameTurnId,
        });
        await this.determinePriorityOrderBasedOnNetWorth(phase);
        await this.handleOpeningNewCompany(phase);
        await this.handleHeadlines(phase);
        await this.handlePrizeRound(phase);
        await this.discountInactiveCompanies(phase);
        break;
      case PhaseName.HEADLINE_RESOLVE:
        await this.resolveHeadlines(phase, game.id);
        break;
      case PhaseName.SET_COMPANY_IPO_PRICES:
        await this.botHandleSetCompanyIpoPrices(game.id);
        break;
      case PhaseName.RESOLVE_SET_COMPANY_IPO_PRICES:
        await this.resolveSetCompanyAndIpoPrices(phase, game.id);
        break;
      case PhaseName.INFLUENCE_BID_ACTION:
        await this.botHandleInfluenceBidAction(game.id);
        break;
      case PhaseName.INFLUENCE_BID_RESOLVE:
        await this.resolveInfluenceBid(phase, game.id);
        break;
      case PhaseName.PRIZE_VOTE_RESOLVE:
        await this.resolvePrizeVotes(phase);
        break;
      case PhaseName.PRIZE_DISTRIBUTE_RESOLVE:
        await this.resolvePrizeDistribution(phase);
        break;
      case PhaseName.STOCK_RESOLVE_LIMIT_ORDER:
        await this.resolveLimitOrders(phase);
        break;
      case PhaseName.STOCK_OPEN_LIMIT_ORDERS:
        await this.openLimitOrders(phase);
        break;
      case PhaseName.STOCK_ACTION_ORDER:
        const updatedPhase = await this.handleNewSubStockActionRound(phase);
        await this.botHandleStockActionOrder(game.id, updatedPhase);
        break;
      case PhaseName.STOCK_ACTION_RESULT:
        if (game.isTimerless) {
          await this.handlePhaseTransition({
            phase,
            gameId: phase.gameId,
          });
        }
        break;
      case PhaseName.STOCK_ACTION_REVEAL:
        await this.handleStockActionReveal(phase);
        break;
      case PhaseName.STOCK_RESOLVE_MARKET_ORDER:
        //resolve stock round
        await this.resolveMarketOrdersSingleOrderResolve(phase, game);
        if(game.operationMechanicsVersion === OperationMechanicsVersion.MODERN) {
          await this.assignCeo(phase, game);
        }
        break;
      case PhaseName.STOCK_RESOLVE_PENDING_OPTION_ORDER:
        await this.openOptionsOrders(phase);
        break;
      case PhaseName.STOCK_RESOLVE_OPTION_ORDER:
        await this.resolveExpiredOptionContracts(phase);
        break;
      case PhaseName.STOCK_SHORT_ORDER_INTEREST:
        await this.resolveBorrowInterestShorts(phase);
        break;
      case PhaseName.STOCK_RESOLVE_PENDING_SHORT_ORDER:
        await this.resolvePendingShortOrders(phase);
        break;
      case PhaseName.STOCK_RESULTS_OVERVIEW:
        //"lock" company actions for the next series of company action phases
        await this.lockCompanyActions(phase);
        if (game.isTimerless) {
          await this.handlePhaseTransition({
            phase,
            gameId: phase.gameId,
          });
        }
        break;
      case PhaseName.OPERATING_PRODUCTION:
        await this.resolveOperatingProduction(phase);
        break;
      case PhaseName.OPERATING_PRODUCTION_VOTE:
        await this.botHandleOperatingProductionVote(game.id);
        break;
      case PhaseName.OPERATING_PRODUCTION_VOTE_RESOLVE:
        await this.resolveOperatingProductionVotes(phase);
        // AUTO-FORWARD: Execute Capital Gains and Divestment automatically before END_TURN
        // These phases are processed but don't require player ready-up
        // This handles the modern operations flow: OPERATING_PRODUCTION_VOTE_RESOLVE -> OPERATING_STOCK_PRICE_ADJUSTMENT -> (auto) CAPITAL_GAINS -> (auto) DIVESTMENT -> END_TURN
        await this.resolveCapitalGainsViaTurnIncome(phase);
        await this.resolveDivestment(phase);
        break;
      case PhaseName.OPERATING_STOCK_PRICE_ADJUSTMENT:
        await this.adjustStockPrices(phase);
        //TODO: Why is this necessary?
        //await this.createOperatingRoundCompanyActions(phase);
        await this.decrementSectorDemandBonus(phase);
        await this.decrementCompanyTemporarySupplyBonus(phase);
        await this.decrementActiveCompanyDemand(phase);
        
        // AUTO-FORWARD: Execute Capital Gains and Divestment automatically before END_TURN
        // These phases are processed but don't require player ready-up
        await this.resolveCapitalGainsViaTurnIncome(phase);
        await this.resolveDivestment(phase);
        
        if (game.isTimerless) {
          await this.handlePhaseTransition({
            phase,
            gameId: phase.gameId,
          });
        }
        break;
      case PhaseName.OPERATING_ACTION_COMPANY_VOTE:
        await this.botHandleOperatingActionCompanyVote(game.id);
        break;
      case PhaseName.OPERATING_ACTION_COMPANY_VOTE_RESULT:
        await this.resolveCompanyVotes(phase);
        if (game.isTimerless) {
          await this.handlePhaseTransition({
            phase,
            gameId: phase.gameId,
          });
        }
        break;
      case PhaseName.OPERATING_COMPANY_VOTE_RESOLVE:
        await this.resolveCompanyAction(phase);
        break;
      case PhaseName.CAPITAL_GAINS:
        await this.resolveCapitalGainsViaTurnIncome(phase);
        break;
      case PhaseName.DIVESTMENT:
        await this.resolveDivestment(phase);
        break;
      case PhaseName.FACTORY_CONSTRUCTION:
        await this.resolveFactoryConstruction(phase);
        break;
      case PhaseName.END_TURN:
        // Only adjust economy score for legacy mechanics
        // Modern mechanics calculate economy score in updateWorkforceTrack (START_TURN phase)
        if (game.operationMechanicsVersion !== OperationMechanicsVersion.MODERN) {
          await this.adjustEconomyScore(phase);
        }
        await this.resolveCompanyLoans(phase);
        await this.resolveCompanyAwards(phase);
        if (game.useOptionOrders) {
          await this.optionContractGenerate(phase);
        }
        const isEndGame = await this.checkAndTriggerEndGame(phase);
        if (!isEndGame) {
          await this.resolveEndTurn(phase);
        }
        break;
      default:
        return;
    }
  }

  // Iterate over all factory construction orders from the previous phase and construct factories
  // Note: This is the LEGACY version, modern mechanics use ModernOperationMechanicsService
  async resolveFactoryConstruction(phase: Phase) {
    //get all factory construction orders from the previous phase
    const factoryConstructionOrders = await this.prisma.factoryConstructionOrder.findMany({
      where: { gameTurnId: phase.gameTurnId },
    });
    //iterate over factory construction orders and construct factories
    const factoryConstructionPromises = factoryConstructionOrders.map(async (order) => {
      // Get next slot for this company
      const existingFactories = await this.prisma.factory.count({
        where: { companyId: order.companyId, gameId: order.gameId },
      });

      //construct factory
      await this.prisma.factory.create({
        data: {
          companyId: order.companyId,
          sectorId: order.sectorId,
          gameId: order.gameId,
          size: order.size,
          workers: 0, // Legacy: workers assigned separately
          slot: existingFactories + 1,
          isOperational: true, // Legacy: operational immediately
          resourceTypes: order.resourceTypes,
        },
      });
    });
    await Promise.all(factoryConstructionPromises);
  }
  
  async assignCeo(phase: Phase, game: Game) {
    //iterate over all companies and check the share ownership of each company, the player with the most shares is the ceo, 
    // in the case of a tie, the player with priority is the ceo
    const companies = await this.companyService.companiesWithRelations({
      where: { gameId: phase.gameId },
    });
    
    // Get player priorities once for all companies
    const playerPriorities = await this.playerPriorityService.listPlayerPriorities({
      where: { gameTurnId: phase.gameTurnId },
    });
    
    // Create a map of player priorities for quick lookup
    const priorityMap = new Map<string, number>();
    playerPriorities.forEach(pp => {
      priorityMap.set(pp.playerId, pp.priority);
    });
    
    // iterate over companies and get the player with the most shares
    const ceoPromises = companies.map(async (company) => {
      const shares = company.Share;
      // Only count shares owned by players (location === PLAYER), not IPO or OPEN_MARKET
      const playerShareCounts = shares
        .filter(share => share.location === ShareLocation.PLAYER && share.Player?.id)
        .reduce((acc, share) => {
          const playerId = share.Player!.id;
          if (acc[playerId]) {
            acc[playerId] += 1;
          } else {
            acc[playerId] = 1;
          }
          return acc;
        }, {} as Record<string, number>);
      
      // If no player-owned shares, disconnect CEO or skip
      const playerIds = Object.keys(playerShareCounts);
      if (playerIds.length === 0) {
        // No player owns shares, disconnect CEO
        await this.companyService.updateCompany({
          where: { id: company.id },
          data: { ceo: { disconnect: true } },
        });
        return;
      }
      
      // Find the maximum share count
      const maxShareCount = Math.max(...Object.values(playerShareCounts));
      
      // If company already has a CEO, only reassign if someone has MORE shares (not equal)
      // Ties do not exchange CEO - current CEO keeps position if tied
      if (company.ceoId) {
        const currentCeoShareCount = playerShareCounts[company.ceoId] || 0;
        
        // Check if current CEO still has the max share count
        if (currentCeoShareCount >= maxShareCount) {
          // Current CEO still has max shares (or is tied), keep them as CEO
          // No need to update - CEO stays the same
          return;
        }
        
        // Current CEO has fewer shares, check if someone has MORE than current CEO
        const playersWithMoreShares = playerIds.filter(
          playerId => playerShareCounts[playerId] > currentCeoShareCount
        );
        
        if (playersWithMoreShares.length === 0) {
          // No one has more shares than current CEO, keep current CEO
          return;
        }
        
        // Someone has more shares, find who has the most (will reassign)
        const newMaxShareCount = Math.max(
          ...playersWithMoreShares.map(playerId => playerShareCounts[playerId])
        );
        const playersWithNewMaxShares = playersWithMoreShares.filter(
          playerId => playerShareCounts[playerId] === newMaxShareCount
        );
        
        // Determine new CEO (use priority for ties, otherwise use the one with most shares)
        let ceoPlayerId: string | null = null;
        if (playersWithNewMaxShares.length === 1) {
          ceoPlayerId = playersWithNewMaxShares[0];
        } else {
          // Tie exists among players with more shares, use player priority to break it
          // Lower priority number wins (priority 1 is better than priority 2)
          let lowestPriority = Infinity;
          let selectedPlayerId: string | null = null;
          
          for (const playerId of playersWithNewMaxShares) {
            const priority = priorityMap.get(playerId);
            if (priority !== undefined) {
              if (priority < lowestPriority) {
                lowestPriority = priority;
                selectedPlayerId = playerId;
              }
            }
          }
          
          ceoPlayerId = selectedPlayerId || playersWithNewMaxShares[0];
        }
        
        // Reassign CEO to the player with more shares
        if (ceoPlayerId) {
          const playerExists = await this.prisma.player.findUnique({
            where: { id: ceoPlayerId },
          });
          
          if (playerExists) {
            await this.companyService.updateCompany({
              where: { id: company.id },
              data: { ceo: { connect: { id: ceoPlayerId } } },
            });
          }
        }
        return;
      }
      
      // No existing CEO - assign new CEO based on most shares
      // Find all players with the maximum share count (potential ties)
      const playersWithMaxShares = playerIds.filter(
        playerId => playerShareCounts[playerId] === maxShareCount
      );
      
      let ceoPlayerId: string | null = null;
      
      if (playersWithMaxShares.length === 1) {
        // No tie, use the player with most shares
        ceoPlayerId = playersWithMaxShares[0];
      } else {
        // Tie exists, use player priority to break it
        // Lower priority number wins (priority 1 is better than priority 2)
        let lowestPriority = Infinity;
        let selectedPlayerId: string | null = null;
        
        for (const playerId of playersWithMaxShares) {
          const priority = priorityMap.get(playerId);
          // Only consider players who have a priority assigned
          if (priority !== undefined) {
            if (priority < lowestPriority) {
              lowestPriority = priority;
              selectedPlayerId = playerId;
            }
          }
        }
        
        // If we found a player with lowest priority, use them
        // If no players have priority assigned (or all have same priority), use the first one as fallback
        ceoPlayerId = selectedPlayerId || playersWithMaxShares[0];
      }
      
      // Verify player exists before connecting
      if (ceoPlayerId) {
        const playerExists = await this.prisma.player.findUnique({
          where: { id: ceoPlayerId },
        });
        
        if (playerExists) {
          await this.companyService.updateCompany({
            where: { id: company.id },
            data: { ceo: { connect: { id: ceoPlayerId } } },
          });
        } else {
          // Player doesn't exist, disconnect CEO
          await this.companyService.updateCompany({
            where: { id: company.id },
            data: { ceo: { disconnect: true } },
          });
        }
      } else {
        // No valid CEO found, disconnect
        await this.companyService.updateCompany({
          where: { id: company.id },
          data: { ceo: { disconnect: true } },
        });
      }
    });
    await Promise.all(ceoPromises);
  }

  async resolveSetCompanyAndIpoPrices(phase: Phase, gameId: string) {
    //get all companies that have no ipo price set
    const companies = await this.companyService.companiesWithSector({
      where: { gameId, ipoAndFloatPrice: null },
    });
    //get all company ipo price votes
    const companyIpoVotes = await this.prisma.companyIpoPriceVote.findMany({
      where: { gameTurnId: phase.gameTurnId },
    });
    //group votes by company
    const groupedVotes = companyIpoVotes.reduce(
      (acc, vote) => {
        if (!acc[vote.companyId]) {
          acc[vote.companyId] = [];
        }
        acc[vote.companyId].push(vote);
        return acc;
      },
      {} as Record<string, CompanyIpoPriceVote[]>,
    );

    // Determine IPO prices for each company
    const companyIpoPrices = companies.map((company) => {
      const votes = groupedVotes[company.id] || [];
      let averagePrice: number;

      if (votes.length > 0) {
        const total = votes.reduce((acc, vote) => acc + vote.ipoPrice, 0);
        averagePrice = total / votes.length;
      } else {
        // Calculate the middle value between ipoMin and ipoMax
        averagePrice = (company.Sector.ipoMin + company.Sector.ipoMax) / 2;
      }

      // Find the closest price on stockGridPrices
      const closestPrice = stockGridPrices.reduce((acc, price) => {
        return Math.abs(price - averagePrice) < Math.abs(acc - averagePrice)
          ? price
          : acc;
      });

      return { companyId: company.id, price: closestPrice };
    });
    for (const { companyId, price } of companyIpoPrices) {
      const company = companies.find((company) => company.id === companyId);
      if (!company) {
        console.error('Company not found');
        throw new Error('Company not found');
      }
      this.setIpoPriceAndCreateSharesAndInjectCapital(
        price,
        company,
        phase.gameId,
      );
    }
  }

  async resolveCompanyAwards(phase: Phase) {
    //check all tracks to see if any companies have reached the end
    //get all tracks for game id
    const companyAwardTracks =
      await this.companyAwardTrackService.listCompanyAwardTracksWithRelations({
        where: { gameId: phase.gameId },
      });
    //get the last space of each track
    const lastSpaces = companyAwardTracks.map((track) => {
      return track.companyAwardTrackSpaces[
        track.companyAwardTrackSpaces.length - 1
      ];
    });
    //filter all companies that have not received awards
    const companiesThatHaventReceivedAward = lastSpaces.map((space) => {
      return space.companySpaces.filter((companySpace) => {
        return companySpace.receivedAward === false;
      });
    });
    //flatten this
    const companiesThatHaventReceivedAwardFlat =
      companiesThatHaventReceivedAward.flat();
    //iterate over companies and apply passive effect
    const companyPassiveEffectPromises =
      companiesThatHaventReceivedAwardFlat.map(async (companySpace) => {
        this.applyPassiveEffect({
          companyId: companySpace.companyId,
          effectName: getPassiveEffectForSector(
            companySpace.Company.Sector.sectorName,
          ),
        });
        //update companySpace to received award
        return this.prisma.companySpace.update({
          where: { id: companySpace.id },
          data: { receivedAward: true },
        });
      });
    await Promise.all(companyPassiveEffectPromises);
    //companies get prestige bonus
    const companyPrestigePromises = companiesThatHaventReceivedAwardFlat.map(
      (companySpace) => {
        this.companyService.updateCompany({
          where: { id: companySpace.companyId },
          data: { prestigeTokens: { increment: AWARD_PRESTIGE_BONUS } },
        });
      },
    );
    await Promise.all(companyPrestigePromises);
  }

  async discountInactiveCompanies(phase: Phase) {
    //get all inactive companies
    const companies = await this.companyService.companiesWithSector({
      where: { gameId: phase.gameId, status: CompanyStatus.INACTIVE },
    });
    //check if all of the shares are still in the ipo
    const companiesWithAllSharesInIPO = companies.filter((company) => {
      return company.Share.every(
        (share) => share.location === ShareLocation.IPO,
      );
    });
    //decrement stock price for each company
    const companyPromises = companies.map((company) => {
      return this.companyService.updateCompany({
        where: { id: company.id },
        data: {
          ipoAndFloatPrice: Math.max(
            5,
            (company.ipoAndFloatPrice || 0) -
              INACTIVE_COMPANY_PER_TURN_DISCOUNT,
          ),
        },
      });
    });
    await Promise.all(companyPromises);
  }

  async decrementActiveCompanyDemand(phase: Phase) {
    //get all active or insolvent companies
    const companies = await this.companyService.companies({
      where: {
        gameId: phase.gameId,
        OR: [
          { status: CompanyStatus.ACTIVE },
          { status: CompanyStatus.INSOLVENT },
        ],
      },
    });
    //decrement demand for each company
    const companyPromises = companies.map((company) => {
      return this.companyService.updateCompany({
        where: { id: company.id },
        data: { demandScore: Math.max(0, company.demandScore - 1) },
      });
    });
    await Promise.all(companyPromises);
  }

  async resolveHeadlines(phase: Phase, gameId: string) {
    //get headlines with slots
    const headlines = await this.headlineService.listHeadlines({
      where: { gameId: gameId, saleSlot: { not: null } },
    });
    //for all headlines that have playerHeadlines, attempt to pay for them from player's account
    const playerHeadlines = headlines.filter(
      (headline) => headline.playerHeadlines.length > 0,
    );
    const playerHeadlinePromises = playerHeadlines.map((headline) => {
      return this.playerPayForHeadline(headline, phase);
    });
    const headlinesResolved = await Promise.all(playerHeadlinePromises);
    //for each sold headline, perform the headline action
    const headlineActionsPromises = headlinesResolved.map((headline) => {
      if (headline) {
        return this.performHeadlineAction(headline, phase);
      }
    });
  }

  async adjustSectorPriorityDown(
    gameId: string,
    sectorId: string,
    amount: number,
  ) {
    const sectorPriorities = await this.prisma.sectorPriority.findMany({
      where: { gameId },
    });

    if (!sectorPriorities || sectorPriorities.length === 0) {
      throw new Error('Sector priorities not found');
    }

    const sectorPriority = sectorPriorities.find(
      (sectorPriority) => sectorPriority.sectorId === sectorId,
    );

    if (!sectorPriority) {
      throw new Error('Sector priority not found');
    }

    const maxPriority = DEFAULT_SECTOR_AMOUNT;
    const oldPriority = sectorPriority.priority;
    const newPriority = Math.min(oldPriority + amount, maxPriority);

    // Update the priority of the selected sector
    await this.prisma.sectorPriority.update({
      where: { id: sectorPriority.id },
      data: {
        priority: newPriority,
      },
    });

    // Adjust other sectors' priorities
    const sectorsToAdjust = sectorPriorities.filter(
      (sp) =>
        sp.sectorId !== sectorId &&
        sp.priority > oldPriority &&
        sp.priority <= newPriority,
    );

    for (const sp of sectorsToAdjust) {
      await this.prisma.sectorPriority.update({
        where: { id: sp.id },
        data: {
          priority: sp.priority - 1,
        },
      });
    }
  }

  async adjustSectorPriorityUp(
    gameId: string,
    sectorId: string,
    amount: number,
  ) {
    const sectorPriorities = await this.prisma.sectorPriority.findMany({
      where: { gameId },
    });

    if (!sectorPriorities || sectorPriorities.length === 0) {
      throw new Error('Sector priorities not found');
    }

    const sectorPriority = sectorPriorities.find(
      (sectorPriority) => sectorPriority.sectorId === sectorId,
    );

    if (!sectorPriority) {
      throw new Error('Sector priority not found');
    }

    const minPriority = 1;
    const oldPriority = sectorPriority.priority;
    const newPriority = Math.max(oldPriority - amount, minPriority);

    // Update the priority of the selected sector
    await this.prisma.sectorPriority.update({
      where: { id: sectorPriority.id },
      data: {
        priority: newPriority,
      },
    });

    // Adjust other sectors' priorities
    const sectorsToAdjust = sectorPriorities.filter(
      (sp) =>
        sp.sectorId !== sectorId &&
        sp.priority >= newPriority &&
        sp.priority < oldPriority,
    );

    for (const sp of sectorsToAdjust) {
      await this.prisma.sectorPriority.update({
        where: { id: sp.id },
        data: {
          priority: sp.priority + 1,
        },
      });
    }
  }

  async performHeadlineAction(headline: Headline, currentPhase: Phase) {
    if (headline.sectorId) {
      switch (headline.type) {
        case HeadlineType.SECTOR_NEGATIVE_1:
          this.adjustSectorPriorityDown(
            currentPhase.gameId,
            headline.sectorId,
            1,
          );
          break;
        case HeadlineType.SECTOR_NEGATIVE_2:
          this.adjustSectorPriorityDown(
            currentPhase.gameId,
            headline.sectorId,
            2,
          );
          break;
        case HeadlineType.SECTOR_NEGATIVE_3:
          this.adjustSectorPriorityDown(
            currentPhase.gameId,
            headline.sectorId,
            3,
          );
          break;
        case HeadlineType.SECTOR_POSITIVE_1:
          this.adjustSectorPriorityUp(
            currentPhase.gameId,
            headline.sectorId,
            1,
          );
          break;
        case HeadlineType.SECTOR_POSITIVE_2:
          this.adjustSectorPriorityUp(
            currentPhase.gameId,
            headline.sectorId,
            2,
          );
          break;
        case HeadlineType.SECTOR_POSITIVE_3:
          this.adjustSectorPriorityUp(
            currentPhase.gameId,
            headline.sectorId,
            3,
          );
          break;
        default:
          break;
      }
    }
  }
  async playerPayForHeadline(
    headline: HeadlineWithRelations,
    currentPhase: Phase,
  ): Promise<Headline | undefined> {
    //get game
    const game = await this.gamesService.game({ id: headline.gameId });
    if (!game) {
      console.error('playerPayForHeadline Game not found');
      return;
    }
    //get players
    const playerIds = headline.playerHeadlines.map(
      (playerHeadline) => playerHeadline.playerId,
    );
    const players = await this.playersService.players({
      where: { id: { in: playerIds } },
    });
    if (!players) {
      console.error('playerPayForHeadline Players not found');
      return;
    }
    //attempt to pay for headline by splitting the headline cost among players
    const costPerPlayer = Math.floor(headline.cost / players.length);
    //ensure players have enough money to pay
    const doPlayersHaveEnoughMoney = players.every(
      (player) => player.cashOnHand >= costPerPlayer,
    );
    if (!doPlayersHaveEnoughMoney) {
      //this is an assertion, we should never reach this point as this check is made on the initial mutation during the headline purchase
      throw new Error('Players do not have enough money to pay for headline');
    }
    const playerPromises = players.map((player) => {
      return this.playerRemoveMoney(
        headline.gameId,
        headline.playerHeadlines[0]?.gameTurnId,
        currentPhase.id,
        player.id,
        costPerPlayer,
        EntityType.BANK,
        'Headline purchase',
        TransactionSubType.HEADLINE_PURCHASE,
      );
    });
    await Promise.all(playerPromises);
    //update headline location and remove sale slot
    return await this.headlineService.updateHeadline({
      where: { id: headline.id },
      data: { location: HeadlineLocation.SOLD, saleSlot: null },
    });
  }

  /**
   * On every turn after turn 1, create headlines and discard them.
   * On turn 2, create three headlines and put them in "slots" 1, 2 and 3.
   * On subsequent turns, "push" remaining headlines from right to left ( so 3 -> 2, 2 -> 1, 1 -> discard).
   * Fill empty slots with new headlines.
   *
   * @param phase
   * @returns
   */
  async handleHeadlines(phase: Phase) {
    // Get game
    const game = await this.gamesService.game({ id: phase.gameId });
    if (!game) {
      throw new Error('Game not found');
    }

    // Get current game turn
    const gameTurn = await this.gameTurnService.getCurrentTurn(phase.gameId);
    if (!gameTurn) {
      throw new Error('Game turn not found');
    }

    // If turn is 1, skip
    if (gameTurn.turn === 1) {
      return;
    }

    let headlinesToCreate;

    // If turn is 2, create 3 headlines
    if (gameTurn.turn === 2) {
      headlinesToCreate = await generateHeadlines(this.prisma, phase, 3);
      // Map slotNumber to headlines
      headlinesToCreate = headlinesToCreate.map((headline, index) => ({
        ...headline,
        saleSlot: index + 1,
      }));
    } else {
      // Get headlines with saleSlot not null and order them by saleSlot
      const headlines = await this.headlineService.listHeadlines({
        where: { gameId: game.id, saleSlot: { not: null } },
        orderBy: { saleSlot: 'asc' },
      });

      // Find and discard the headline in slot 1 if all slots are filled
      if (headlines.length === 3) {
        const headlineInSlot1 = headlines.find(
          (headline) => headline.saleSlot === 1,
        );
        if (headlineInSlot1) {
          await this.headlineService.updateHeadline({
            where: { id: headlineInSlot1.id },
            data: { location: HeadlineLocation.DISCARDED, saleSlot: null },
          });
        }
      }

      // Shift headlines from right to left
      for (let slot = 2; slot <= 3; slot++) {
        const headline = headlines.find((h) => h.saleSlot === slot);
        if (headline) {
          await this.headlineService.updateHeadline({
            where: { id: headline.id },
            data: { saleSlot: slot - 1 },
          });
        }
      }

      // Recalculate filled and empty slots
      const updatedHeadlines = await this.headlineService.listHeadlines({
        where: { gameId: game.id, saleSlot: { not: null } },
        orderBy: { saleSlot: 'asc' },
      });

      const filledSlots = updatedHeadlines.map((headline) => headline.saleSlot);
      const emptySlots = [1, 2, 3].filter(
        (slot) => !filledSlots.includes(slot),
      );

      // Create new headlines for empty slots
      headlinesToCreate = await generateHeadlines(
        this.prisma,
        phase,
        emptySlots.length,
      );

      // Map slotNumber to headlines
      headlinesToCreate = headlinesToCreate.map((headline, index) => ({
        ...headline,
        saleSlot: emptySlots[index],
      }));
    }

    await this.headlineService.createManyHeadlines(headlinesToCreate);
  }

  async lockCompanyActions(phase: Phase) {
    // Get the game
    const game = await this.gamesService.game({ id: phase.gameId });
    if (!game) {
      throw new Error('Game not found');
    }

    // Get the current game turn
    const gameTurn = await this.gameTurnService.getCurrentTurn(phase.gameId);
    if (!gameTurn) {
      throw new Error('Game turn not found');
    }

    // Get all active and insolvent companies
    const companies = await this.companyService.companies({
      where: {
        gameId: phase.gameId,
        OR: [
          { status: CompanyStatus.ACTIVE },
          { status: CompanyStatus.INSOLVENT },
        ],
      },
    });

    // Get company priority order
    const companyPriorityOrder = companyPriorityOrderOperations(companies);
    // Fetch existing company action orders for the current game turn
    const existingActionOrders =
      await this.companyActionOrderService.listCompanyActionOrders({
        where: {
          gameTurnId: gameTurn.id,
        },
      });

    // Build a set of company IDs that already have action orders
    const existingCompanyIds = new Set(
      existingActionOrders.map((order) => order.companyId),
    );

    // Filter out companies that already have an action order for this game turn
    const newCompanyActionOrders: Prisma.CompanyActionOrderCreateManyInput[] =
      [];
    companyPriorityOrder.forEach((company, index) => {
      if (!existingCompanyIds.has(company.id)) {
        newCompanyActionOrders.push({
          companyId: company.id,
          gameTurnId: gameTurn.id,
          orderPriority: index,
        });
      }
    });

    // Create new company action orders
    if (newCompanyActionOrders.length > 0) {
      return this.companyActionOrderService.createManyCompanyActionOrders(
        newCompanyActionOrders,
      );
    } else {
      return []; // or handle accordingly
    }
  }

  async resolvePrizeVotes(phase: Phase) {
    // Parallel fetching of game and votes
    const [game, votes] = await Promise.all([
      this.gamesService.game({ id: phase.gameId }),
      this.prizeVoteService.listPrizeVotes({
        where: { gameTurnId: phase.gameTurnId }, // Corrected here
      }),
    ]);
    if (!game) {
      throw new Error('Game not found');
    }

    if (votes.length === 0) {
      return; // No votes to process
    }

    // Group votes by prize
    const groupedVotes = votes.reduce(
      (acc, vote) => {
        if (!acc[vote.prizeId]) {
          acc[vote.prizeId] = [];
        }
        acc[vote.prizeId].push(vote);
        return acc;
      },
      {} as { [key: string]: PrizeVoteWithRelations[] },
    );

    const prizeIds = Object.keys(groupedVotes);

    const prizePromises: Promise<any>[] = [];
    const gameLogPromises: Promise<any>[] = [];

    // Process votes in parallel
    prizeIds.forEach((prizeId) => {
      const votes = groupedVotes[prizeId];
      if (votes.length === 1) {
        prizePromises.push(
          this.prizeService.updatePrize({
            where: { id: prizeId },
            data: { Player: { connect: { id: votes[0].playerId } } },
          }),
        );
        gameLogPromises.push(
          this.gameLogService.createGameLog({
            game: { connect: { id: phase.gameId } },
            content: `Player ${votes[0].Player.nickname} has won a prize.`,
          }),
        );
      }
    });

    await Promise.all([...prizePromises, ...gameLogPromises]);

    // Fetch prizes to check distribution status
    const prizes = await this.prizeService.listPrizes({
      where: { gameTurnId: phase.gameTurnId }, // Make sure this is correct
    });

    const undistributedPrizes = prizes.filter((prize) => !prize.playerId);

    if (undistributedPrizes.length === 0) {
      // Double cash value of distributed prizes
      const doublePrizePromises = prizes.map((prize) => {
        return this.prizeService.updatePrize({
          where: { id: prize.id },
          data: { cashAmount: (prize.cashAmount || 0) * 2 },
        });
      });
      await Promise.all(doublePrizePromises);
    }
  }

  /**
   * Distribute cash prizes that have not yet been assigned.
   * @param phase
   */
  async resolvePrizeDistribution(phase: Phase) {
    //get game
    const game = await this.gamesService.game({ id: phase.gameId });
    if (!game) {
      throw new Error('Game not found');
    }
    if (!game.currentPhaseId) {
      throw new Error('Current phase not found');
    }
    //get all prizes for current turn
    const prizes = await this.prizeService.listPrizes({
      where: { gameTurnId: game.currentTurn },
    });
    //if any prizes have remaining cash, distribute it to the owning player
    const playerAddMoneyPromises: Promise<any>[] = [];
    for (let i = 0; i < prizes.length; i++) {
      const prize = prizes[i];
      if ((prize.cashAmount || 0) > 0 && prize.playerId) {
        playerAddMoneyPromises.push(
          this.playerAddMoney({
            gameId: game.id,
            gameTurnId: game.currentTurn,
            phaseId: game.currentPhaseId,
            playerId: prize.playerId,
            amount: prize.cashAmount || 0,
            fromEntity: EntityType.BANK,
            description: 'Prize cash distribution.',
            transactionSubType: TransactionSubType.TRANCHE,
          }),
        );
      }
    }
  }

  async handlePrizeRound(phase: Phase) {
    // Check if it's the third turn to trigger the prize round
    const gameTurn = await this.gameTurnService.getCurrentTurn(phase.gameId);
    if (!gameTurn) {
      throw new Error('Game turn not found');
    }
    if (gameTurn.turn % 3 !== 0) {
      return;
    }

    // Fetch players and determine prize count
    const players = await this.playersService.players({
      where: { gameId: phase.gameId },
    });
    if (!players) {
      throw new Error('Players not found');
    }

    let prizeCount = Math.max(2, players.length - 1); // Ensure at least 2 prizes
    prizeCount = Math.min(prizeCount, 6); // Ensure no more than 6 prizes

    // Fetch sectors
    const sectors = await this.sectorService.sectors({
      where: { gameId: phase.gameId },
    });
    if (!sectors) {
      throw new Error('Sectors not found');
    }

    const sectorIds = sectors.map((sector) => sector.id);
    const shuffledSectorIds = sectorIds.sort(() => 0.5 - Math.random());

    // Create prizes with random distribution of rewards
    const prizePromises: Promise<any>[] = [];
    let prestigeRewardsLeft = 2;
    const totalCash = PRIZE_CASH_SUM;
    const cashDistribution: number[] = [];
    // const remainder = totalCash % prizeCount;
    let remainingCash = totalCash;
    // Randomly assign cash to each prize
    for (let i = 0; i < prizeCount - 1; i++) {
      // Generate a random cash amount between 0 and the remaining cash for this prize
      const randomCash = Math.floor(Math.random() * remainingCash);
      cashDistribution.push(randomCash);
      remainingCash -= randomCash;
    }
    // The last prize gets the remaining cash
    cashDistribution.push(remainingCash);

    for (let i = 0; i < prizeCount; i++) {
      const prize: Prisma.PrizeCreateInput = {
        prestigeAmount: 0,
        cashAmount: cashDistribution[i],
        Game: { connect: { id: gameTurn.gameId } },
        GameTurn: { connect: { id: gameTurn.id } },
        SectorPrizes: {
          create: [
            {
              sectorId: shuffledSectorIds[i % shuffledSectorIds.length],
            },
          ],
        },
      };

      // Randomly assign prestige rewards
      if (prestigeRewardsLeft > 0) {
        prize.prestigeAmount = 1;
        prestigeRewardsLeft--;
      }

      // Push each prize creation promise into the array
      prizePromises.push(this.prizeService.createPrize(prize));
    }

    // Execute all prize creation promises concurrently
    await Promise.all(prizePromises);
  }

  /**
   * Decrement company supplyCurrent by 1 to a minimum of zero
   * @param phase
   * @returns
   */
  async decrementCompanyTemporarySupplyBonus(phase: Phase) {
    const companies = await this.companyService.companies({
      where: { gameId: phase.gameId },
    });
    if (!companies) {
      return;
    }
    const updatedCompanies = companies.map((company) => {
      return this.companyService.updateCompany({
        where: { id: company.id },
        data: {
          supplyCurrent: Math.max(0, company.supplyCurrent - 1),
        },
      });
    });
    await Promise.all(updatedCompanies);
  }

  /**
   * Once each sector has floated a company, the economy is
   * eligible to begin moving. If at least one company in each
   * sector pay dividends, the economy will move up by 1. If at
   * least one company retains, the economy will move down by 1. If
   * both of these are true, the economy will remain the same.
   * @param phase
   */
  async adjustEconomyScore(phase: Phase) {
    //get game
    const game = await this.gamesService.game({ id: phase.gameId });
    if (!game) {
      throw new Error('Game not found');
    }
    if (!game.currentOperatingRoundId) {
      throw new Error('Operating round not found');
    }
    //get sectors in game
    const sectors = await this.sectorService.sectors({
      where: { gameId: phase.gameId },
    });
    if (!sectors) {
      throw new Error('Sectors not found');
    }
    const companies = await this.companyService.companiesWithSector({
      where: { gameId: phase.gameId, isFloated: true },
    });
    //group companies by sector
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
    //if all sectors have at least one floated company, proceed, otherwise, throw
    const sectorIds = Object.keys(groupedCompanies);
    if (sectorIds.length < sectors.length) {
      //game log
      await this.gameLogService.createGameLog({
        game: { connect: { id: phase.gameId } },
        content: `Not all sectors have floated a company, the economy score remains the same.`,
      });
      return;
    }
    //get all production results for companies of this past operating round
    const productionResults =
      await this.productionResultService.productionResults({
        where: {
          operatingRoundId: game.currentOperatingRoundId,
        },
      });
    //group production results by sector
    const groupedProductionResults = productionResults.reduce(
      (acc, result) => {
        if (!acc[result.Company.sectorId]) {
          acc[result.Company.sectorId] = [];
        }
        acc[result.Company.sectorId].push(result);
        return acc;
      },
      {} as { [key: string]: ProductionResultWithCompany[] },
    );
    //check if each sector has at least one company that pays dividends
    const dividendSectors = Object.entries(groupedProductionResults).filter(
      ([sectorId, results]) => {
        return results.some(
          (result) =>
            result.revenueDistribution ==
              RevenueDistribution.DIVIDEND_FIFTY_FIFTY ||
            result.revenueDistribution == RevenueDistribution.DIVIDEND_FULL,
        );
      },
    );
    //check if each sector has at least one company that retains
    const retainSectors = Object.entries(groupedProductionResults).filter(
      ([sectorId, results]) => {
        return results.some(
          (result) =>
            result.revenueDistribution == RevenueDistribution.RETAINED,
        );
      },
    );
    //if both conditions are met, economy score remains the same
    if (dividendSectors.length > 0 && retainSectors.length > 0) {
      //game log
      await this.gameLogService.createGameLog({
        game: { connect: { id: phase.gameId } },
        content: `All sectors have one company that has retained and one company that has paid dividends, the economy score remains the same.`,
      });
      return;
    }
    //if there is at least one sector with a company that pays dividends, economy score goes up
    if (dividendSectors.length > 0) {
      await this.gamesService.updateGame({
        where: { id: phase.gameId },
        data: { economyScore: game.economyScore + 1 },
      });
      await this.gameLogService.createGameLog({
        game: { connect: { id: phase.gameId } },
        content: `At least one sector has one company that has paid dividends, the economy score has increased by 1.`,
      });
      return;
    }
    //if there is at least one sector with a company that retains, economy score goes down
    if (retainSectors.length > 0) {
      await this.gamesService.updateGame({
        where: { id: phase.gameId },
        data: { economyScore: game.economyScore - 1 },
      });
      await this.gameLogService.createGameLog({
        game: { connect: { id: phase.gameId } },
        content: `At least one sector has one company that has retained, the economy score has decreased by 1.`,
      });
      return;
    }
  }
  /**
   * Check if the game has ended and trigger the end game logic.
   * @param phase
   * @returns
   */
  async checkAndTriggerEndGame(phase: Phase): Promise<boolean> {
    const game = await this.gamesService.game({ id: phase.gameId });
    if (!game) {
      throw new Error('Game not found');
    }
    //check if bank is broken (less than or equal to 0)
    const bank = game.bankPoolNumber;
    if (bank <= 0) {
      await this.endGame(game);
      return true;
    }
    const gameTurn = await this.gameTurnService.getCurrentTurn(phase.gameId);
    if (!gameTurn) {
      throw new Error('Game turn not found');
    }
    const gameMaxTurns = game.gameMaxTurns;
    if (gameMaxTurns) {
      if (gameTurn.turn >= gameMaxTurns) {
        await this.endGame(game);
        return true;
      }
    }
    return false;
  }

  /**
   * End the game, determine the winner and record the final scores.
   * @param game
   */
  async endGame(game: Game) {
    // Get all players from the game
    const players = await this.playersService.playersWithShares({
      gameId: game.id,
    });

    // Calculate net worths for all players
    const netWorths = players.map((player) => {
      return calculateNetWorth(player.cashOnHand, player.Share);
    });

    // Create a game record
    const gameRecord = await this.gameRecordService.createGameRecord({
      game: { connect: { id: game.id } },
    });

    // Calculate placements with proper handling of ties
    const placements = netWorths
      .map((netWorth, index) => {
        return { netWorth, index, placement: 0 }; // Add a placement property here
      })
      .sort((a, b) => b.netWorth - a.netWorth)
      .map((player, index, sortedArray) => {
        if (index > 0 && player.netWorth === sortedArray[index - 1].netWorth) {
          return {
            ...player,
            placement: sortedArray[index - 1].placement,
          };
        } else {
          return { ...player, placement: index + 1 };
        }
      });

    // Award ranking points based on placement and total players in the game
    const totalPlayers = placements.length;
    const baseRankingPoints = 50;
    const rankingPoints = placements.map((placementData) => {
      const bonus = totalPlayers - placementData.placement; // Bonus based on number of players and placement
      const points = Math.max(
        Math.ceil(baseRankingPoints / 2 ** (placementData.placement - 1)) +
          bonus,
        1,
      );
      return {
        playerId: placementData.index,
        rankingPoints: points,
      };
    });

    //filter our all bots from players
    const humanPlayers = players.filter((player) => player.userId);
    // Create player results
    const playerResults = humanPlayers.map((player, index) => {
      const placementData = placements.find((p) => p.index === index)!;
      return {
        gameRecordId: gameRecord.id,
        playerId: player.id,
        userId: player.userId as string, //casting here as we ensure every player has a userId
        netWorth: netWorths[index],
        placement: placementData.placement, // Ensure correct placement for each player
        rankingPoints: rankingPoints.find((p) => p.playerId === index)!
          .rankingPoints,
      };
    });

    // Create many player results
    await this.playerResultService.createManyPlayerResults(playerResults);

    // Update game status to finished
    await this.gamesService.updateGame({
      where: { id: game.id },
      data: { gameStatus: GameStatus.FINISHED },
    });

    // Trigger game ended event
    this.pusherService.trigger(getGameChannelId(game.id), EVENT_GAME_ENDED);
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

    // Check if the game turn is one of the third turns of the game
    if (gameTurn.turn % 3 !== 0) {
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
   * Any demand bonuses are subtracted by 1.
   * This is necessary for temporary bonuses given from the lobby action.
   *
   * @param phase
   */
  async decrementSectorDemandBonus(phase: Phase) {
    //get all sectors and set their demandBonus to 0
    const sectors = await this.sectorService.sectors({
      where: { gameId: phase.gameId },
    });
    if (!sectors) {
      throw new Error('Sectors not found');
    }
    const sectorPromises = sectors.map(async (sector) => {
      await this.sectorService.updateSector({
        where: { id: sector.id },
        data: { demandBonus: Math.max((sector.demandBonus || 0) - 1, 0) },
      });
    });
    await Promise.all(sectorPromises);
  }

  async resolveBorrowInterestShorts(phase: Phase) {
    //get all short orders that are open
    const shortOrders =
      await this.playerOrderService.playerOrdersWithShortOrder({
        where: {
          gameId: phase.gameId,
          orderType: OrderType.SHORT,
          orderStatus: OrderStatus.OPEN,
        },
      });
    //charge interest to players cash on hand (cannot go below 0) by mutltiplying borrowRate by the short order amount
    const shortOrderPromises = shortOrders.map(async (shortOrder) => {
      const borrowTax = Math.floor(
        (shortOrder?.ShortOrder?.shortSalePrice || 0) *
          ((shortOrder?.ShortOrder?.borrowRate || BORROW_RATE) / 100),
      );
      const newCashOnHand = Math.max(
        shortOrder.Player.cashOnHand - borrowTax,
        0,
      );
      await this.playersService.updatePlayer({
        where: { id: shortOrder.playerId },
        data: { cashOnHand: newCashOnHand },
      });
      await this.playerRemoveMoney(
        shortOrder.gameId,
        shortOrder.gameTurnCreated,
        shortOrder.phaseId,
        shortOrder.playerId,
        borrowTax,
        EntityType.BANK,
        `Interest on short order.`,
      );
      await this.gameLogService.createGameLog({
        game: { connect: { id: phase.gameId } },
        content: `Player ${shortOrder.Player.nickname} has been charged $${borrowTax} for interest on a short order.`,
      });
    });
    await Promise.all(shortOrderPromises);
  }

  async resolveCompanyLoans(phase: Phase) {
    const companies = await this.companyService.companiesWithSector({
      where: { gameId: phase.gameId, hasLoan: true },
    });
    if (!companies) {
      throw new Error('Companies not found');
    }

    //take 10% of the loan amount from the company cash on hand, the company cannot go below 0
    const companyLoans = companies.map(async (company) => {
      const newCashOnHand = Math.max(
        company.cashOnHand -
          Math.floor(
            (LOAN_AMOUNT + LOAN_AMOUNT * LOAN_INTEREST_RATE) *
              LOAN_INTEREST_RATE,
          ),
        0,
      );
      await this.companyService.updateCompany({
        where: { id: company.id },
        data: { cashOnHand: newCashOnHand },
      });
    });
    await Promise.all(companyLoans);
  }

  async resolveExpiredOptionContracts(phase: Phase) {
    const openContracts = await this.optionContractService.listOptionContracts({
      where: {
        gameId: phase.gameId,
        contractState: ContractState.PURCHASED,
      },
    });
    //check if the contract has expired
    const expiredContracts = openContracts.filter((contract) => {
      return contract.term === contract.currentTerm;
    });
    //resolve the expired contracts
    const expiredContractPromises = expiredContracts.map(async (contract) => {
      await this.optionContractService.updateOptionContract({
        where: { id: contract.id },
        data: { contractState: ContractState.EXPIRED },
      });
    });
    //get the attached player orders
    const playerOrders = await this.playerOrderService.playerOrders({
      where: {
        gameId: phase.gameId,
        optionContractId: {
          in: expiredContracts.map((contract) => contract.id),
        },
      },
    });
    //reject the player orders
    const playerOrderPromises = playerOrders.map(async (order) => {
      await this.playerOrderService.updatePlayerOrder({
        where: { id: order.id },
        data: { orderStatus: OrderStatus.REJECTED },
      });
    });
    //increment the term of the contracts
    const incrementContractPromises = openContracts.map(async (contract) => {
      await this.optionContractService.updateOptionContract({
        where: { id: contract.id },
        data: { currentTerm: contract.currentTerm + 1 },
      });
    });
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
    
    //sort in ASCENDING order
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

  getStrikePrice(
    term: number,
    currentPrice: number,
    sector: SectorName,
  ): number {
    // Get the interest rate for the term
    const interestRate = interestRatesByTerm[term] || 0;

    // Get the sector volatility
    const volatility = sectorVolatility[sector] || 0;

    // Calculate the premium increment factor based on interest rate and volatility
    const premiumIncrementFactor = 1 + interestRate + volatility;

    // Calculate the strike price
    const strikePrice = currentPrice * premiumIncrementFactor;

    //round up as int
    return Math.ceil(strikePrice);
  }

  calculatePremium(
    currentPrice: number,
    term: number,
    shareCount: number,
    sectorName: SectorName,
  ): number {
    // Get the interest rate for the term
    const interestRate = interestRatesByTerm[term] || 0;

    // Calculate the premium based on the current price, interest rate, and share count
    const premium =
      currentPrice *
      (interestRate + sectorVolatility[sectorName] / 3) *
      shareCount;

    //round up
    return Math.ceil(premium);
  }

  createOptionContract(
    randomCompany: CompanyWithSector,
    _contractState: ContractState,
  ): {
    premium: number;
    strikePrice: number;
    term: number;
    shareCount: number;
    stepBonus: number;
    contractState: ContractState;
  } {
    if (!randomCompany.currentStockPrice) {
      throw new Error('Company does not have a current stock price');
    }
    const minTermLength = OPTION_CONTRACT_MIN_TERM;
    const maxTermLength = OPTION_CONTRACT_MAX_TERM;
    //pick a term length between min and max
    const term =
      Math.floor(Math.random() * (maxTermLength - minTermLength + 1)) +
      minTermLength;
    const strikePrice = this.getStrikePrice(
      term,
      randomCompany.currentStockPrice,
      randomCompany.Sector.sectorName,
    );
    const shareCounts = [
      { shareCount: 3, stepBonus: 1 },
      { shareCount: 5, stepBonus: 1 },
      { shareCount: 7, stepBonus: 1 },
      { shareCount: 10, stepBonus: 2 },
      { shareCount: 12, stepBonus: 2 },
    ];
    const shareCountData =
      shareCounts[Math.floor(Math.random() * shareCounts.length)];
    const premium = this.calculatePremium(
      randomCompany.currentStockPrice,
      term,
      shareCountData.shareCount,
      randomCompany.Sector.sectorName,
    );
    const stepBonus = shareCountData.stepBonus;
    return {
      premium,
      strikePrice,
      term,
      shareCount: shareCountData.shareCount,
      stepBonus,
      contractState: _contractState,
    };
  }
  //generate, queue up and discard option contracts as appropriate.
  //contracts are placed on a tableau, one card is on top is queued, the middle cards are "for sale" and the bottom card is discarded.
  async optionContractGenerate(phase: Phase) {
    const companies = await this.companyService.companiesWithSector({
      where: {
        gameId: phase.gameId,
        isFloated: true,
        status: CompanyStatus.ACTIVE,
      },
    });

    if (!companies) {
      return;
    }
    // Fetch existing option contracts in play
    const optionContracts =
      await this.optionContractService.listOptionContracts({
        where: {
          gameId: phase.gameId,
          contractState: ContractState.FOR_SALE,
        },
      });

    // Generate new option contracts if none exist
    if (optionContracts.length === 0) {
      await this.fillOptionContracts(phase.gameId, companies);
    } else {
      //set all option contracts to be discarded
      await this.optionContractService.updateManyOptionContracts({
        where: {
          gameId: phase.gameId,
          contractState: ContractState.FOR_SALE,
        },
        data: { contractState: ContractState.DISCARDED },
      });
      await this.fillOptionContracts(phase.gameId, companies);
    }
  }

  // Function to create initial option contracts
  async fillOptionContracts(gameId: string, companies: CompanyWithSector[]) {
    const optionContractsToAdd = [];
    for (let i = 0; i < OPTION_CONTRACT_ACTIVE_COUNT; i++) {
      // Pick a random company
      const randomIndex = Math.floor(Math.random() * companies.length);
      const randomCompany = companies[randomIndex];
      optionContractsToAdd.push({
        ...this.createOptionContract(randomCompany, ContractState.FOR_SALE),
        tableauSlot: i + 1,
        gameId,
        companyId: randomCompany.id,
      });
    }
    await this.optionContractService.createManyOptionContracts(
      optionContractsToAdd,
    );
  }

  // Function to update existing option contracts
  async updateExistingOptionContracts(optionContracts: OptionContract[]) {
    const optionContractsToUpdate: {
      where: Prisma.OptionContractWhereUniqueInput;
      data: Prisma.OptionContractUpdateInput;
    }[] = [];
    const optionContractsToDiscard: number[] = [];
    const optionContractsToRequeue: number[] = [];

    optionContracts.forEach((contract) => {
      const newTableauSlot = (contract?.tableauSlot || 0) - 1;
      if (newTableauSlot < 0) {
        optionContractsToDiscard.push(contract.id);
      } else {
        optionContractsToUpdate.push({
          where: { id: contract.id },
          data: { tableauSlot: newTableauSlot },
        });
        if (
          newTableauSlot > 0 &&
          newTableauSlot < OPTION_CONTRACT_ACTIVE_COUNT
        ) {
          optionContractsToRequeue.push(contract.id);
        }
      }
    });

    await Promise.all([
      ...optionContractsToUpdate.map((contract) =>
        this.optionContractService.updateOptionContract(contract),
      ),
      ...optionContractsToDiscard.map((contractId) =>
        this.optionContractService.updateOptionContract({
          where: { id: contractId },
          data: { contractState: ContractState.DISCARDED },
        }),
      ),
      ...optionContractsToRequeue.map((contractId) =>
        this.optionContractService.updateOptionContract({
          where: { id: contractId },
          data: { contractState: ContractState.FOR_SALE },
        }),
      ),
    ]);
  }

  // Function to add a new queued option contract
  async addNewQueuedOptionContract(
    gameId: string,
    companies: CompanyWithSector[],
  ) {
    //pick a random company
    const randomCompany =
      companies[Math.floor(Math.random() * companies.length)];
    const newOptionContract = this.createOptionContract(
      randomCompany,
      ContractState.QUEUED,
    );
    await this.optionContractService.createOptionContract({
      ...newOptionContract,
      tableauSlot: OPTION_CONTRACT_ACTIVE_COUNT + 1,
      Game: { connect: { id: gameId } },
      Company: { connect: { id: randomCompany.id } },
    });
  }
  /**
   * Initial priority order is determined by an influence bid.  Player earn $1 per unspent influence.
   * @param phase
   */
  async resolveInfluenceBid(phase: Phase, gameId: string) {
    const influenceRoundWithVotes =
      await this.influenceRoundService.getInfluenceRound({
        id: phase.influenceRoundId || 0,
      });
    if (!influenceRoundWithVotes) {
      throw new Error('Influence round not found');
    }

    const players = await this.playersService.players({
      where: { gameId: gameId },
    });

    const missingPlayers = players.filter(
      (player) =>
        !influenceRoundWithVotes.InfluenceVotes.some(
          (vote) => vote.playerId === player.id,
        ),
    );

    //create an array of votes with influence and playerId, where if there is no vote in influenceRoundWithVotes we assign the influence score
    //as the default influence score
    const allVotes = [
      ...influenceRoundWithVotes.InfluenceVotes,
      ...missingPlayers.map((player) => ({
        influence: 0,
        playerId: player.id,
      })),
    ];

    const sortedVotes = allVotes.sort((a, b) => b.influence - a.influence);

    const playerPriority = sortedVotes.map((vote, index) => ({
      playerId: vote.playerId,
      priority: index + 1,
      influence: vote.influence,
      gameTurnId: phase.gameTurnId,
    }));

    const gameLogMessages = await Promise.all(
      playerPriority.map(async (priority) => {
        const player = await this.playersService.player({
          id: priority.playerId,
        });
        if (!player) {
          throw new Error('Player not found');
        }
        return {
          gameId: phase.gameId,
          content: `Player ${player.nickname} has a priority of ${
            priority.priority
          } with ${priority.influence} influence. They earned a total of $${
            influenceRoundWithVotes.maxInfluence - priority.influence
          } for unspent influence.`,
        };
      }),
    );

    this.gameLogService.createManyGameLogs(gameLogMessages).catch((error) => {
      console.error('Error creating game log', error);
    });

    const playerPriorityAddMany = playerPriority.map(
      ({ influence, ...rest }) => rest,
    );

    try {
      await this.playerPriorityService.createManyPlayerPriorities(
        playerPriorityAddMany,
      );
    } catch (error) {
      console.error('Error creating player priority', error);
    }

    const playerPriorityUnspentPromises = playerPriority
      .filter(
        (priority) => priority.influence < influenceRoundWithVotes.maxInfluence,
      )
      .map((priority) =>
        this.playerAddMoney({
          gameId: phase.gameId,
          gameTurnId: phase.gameTurnId,
          phaseId: phase.id,
          playerId: priority.playerId,
          amount: influenceRoundWithVotes.maxInfluence - priority.influence,
          fromEntity: EntityType.BANK,
          description: `Unspent influence.`,
          transactionSubType: TransactionSubType.INFLUENCE,
        }),
      );

    await Promise.all(playerPriorityUnspentPromises);
  }

  shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Players who own shares over the share limit must divest at the end of the turn.
   *
   * @param phase
   * @returns
   */
  async resolveDivestment(phase: Phase) {
    const players = await this.playersService.playersWithShares({
      gameId: phase.gameId,
    });
    if (!players) {
      throw new Error('Players not found');
    }

    const game = await this.gamesService.game({
      id: phase.gameId,
    });

    if (!game) {
      throw new Error('Game not found');
    }

    // Iterate over players and collect any that have greater shares than game Share Limit and divest them
    const playersToDivest = players.filter(
      (player) => player.Share.length > game.certificateLimit,
    );
    if (playersToDivest.length === 0) {
      return;
    }

    const sharePromises = playersToDivest.map((player) => async () => {
      let shares = player.Share;
      //filter out all shares that have a shortOrderId
      shares = shares.filter((share) => !share.shortOrderId);
      const shuffledShares = this.shuffleArray([
        ...shares,
      ]) as ShareWithCompany[];
      const sharesToDivest = shuffledShares.slice(game.certificateLimit);
      const companyId = sharesToDivest[0].companyId;

      const shareUpdates = sharesToDivest.map((share) => async () => {
        await this.shareService.updateShare({
          where: { id: share.id },
          data: {
            location: ShareLocation.OPEN_MARKET,
            Player: { disconnect: true },
          },
        });
        //create share transaction
        this.transactionService
          .createTransactionEntityToEntity({
            fromEntityId: player.entityId || undefined,
            fromEntityType: EntityType.PLAYER,
            toEntityType: EntityType.OPEN_MARKET,
            amount: sharesToDivest.length,
            gameId: phase.gameId,
            gameTurnId: phase.gameTurnId,
            phaseId: phase.id,
            transactionType: TransactionType.SHARE,
            transactionSubType: TransactionSubType.DIVESTMENT,
            companyInvolvedId: companyId,
          })
          .catch((error) => {
            console.error('Error creating transaction', error);
          });
      });

      const sellPromises = sharesToDivest.map((share) => async () => {
        const sharePrice = share.Company.currentStockPrice || 0;
        await this.playerAddMoney({
          gameId: share.gameId,
          gameTurnId: phase.gameTurnId,
          phaseId: phase.id,
          playerId: player.id,
          amount: sharePrice,
          fromEntity: EntityType.BANK,
          description: `Divestment of ${share.Company.name} share.`,
          transactionSubType: TransactionSubType.DIVESTMENT,
        });
        await this.gameLogService.createGameLog({
          game: { connect: { id: share.gameId } },
          content: `Player ${player.nickname} has sold 1 share of ${
            share.Company.name
          } at $${sharePrice.toFixed(2)} due to DIVESTMENT`,
        });
      });

      await this.processBatch(sellPromises);
      await this.processBatch(shareUpdates);

      const netDifference = sharesToDivest.length;

      const stockPrice = await this.stockHistoryService.moveStockPriceDown(
        phase.gameId,
        companyId,
        phase.id,
        sharesToDivest[0].Company.currentStockPrice || 0,
        netDifference,
        StockAction.MARKET_SELL,
      );

      await this.gameLogService.createGameLog({
        game: { connect: { id: phase.gameId } },
        content: `Stock price for ${sharesToDivest[0].Company.name} has decreased to $${stockPrice.price} by ${netDifference} steps due to market sell orders during DIVESTMENT`,
      });

      await this.playerOrderService.triggerLimitOrdersFilled(
        sharesToDivest[0].Company.currentStockPrice || 0,
        stockPrice.price,
        companyId,
      );

      await this.companyService.updateCompany({
        where: { id: companyId },
        data: {
          stockTier: getCurrentTierBySharePrice(stockPrice.price),
        },
      });
    });

    const BATCH_SIZE = 5;
    for (let i = 0; i < sharePromises.length; i += BATCH_SIZE) {
      const batch = sharePromises.slice(i, i + BATCH_SIZE);
      await this.processBatch(batch);
    }
  }

  /**
   * Create capital gains tax for players based on their net worth.
   * @param phase
   * @returns
   */
  async resolveCapitalGainsViaNetWorth(phase: Phase) {
    // Calculate capital gains based on player net worth
    const players = await this.playersService.playersWithShares({
      gameId: phase.gameId,
    });
    if (!players) {
      throw new Error('Players not found');
    }

    const netWorths = players.map((player) => {
      return {
        playerId: player.id,
        netWorth: calculateNetWorth(player.cashOnHand, player.Share),
      };
    });

    const capitalGainsUpdates = [];
    const playerUpdatePromises = [];
    const gameLogPromises = [];

    for (const { playerId, netWorth } of netWorths) {
      // Find the appropriate tax tier
      const tier = CapitalGainsTiers.find(
        (tier) => netWorth >= tier.minNetWorth && netWorth <= tier.maxNetWorth,
      );

      if (!tier) {
        console.error(`No tax tier found for net worth: ${netWorth}`);
        continue;
      }

      let taxAmount = netWorth * (tier.taxPercentage / 100);
      const player = players.find((p) => p.id === playerId);
      //round tax amount down
      taxAmount = Math.floor(taxAmount);
      if (!player) {
        console.error(`Player not found: ${playerId}`);
        continue;
      }

      if (taxAmount > 0) {
        // Update player cash on hand
        capitalGainsUpdates.push({
          playerId,
          capitalGains: taxAmount,
          gameId: phase.gameId,
          gameTurnId: phase.gameTurnId,
          taxPercentage: tier.taxPercentage,
        });

        playerUpdatePromises.push(
          this.playerRemoveMoney(
            phase.gameId,
            phase.gameTurnId,
            phase.id,
            playerId,
            taxAmount,
            EntityType.BANK,
            `Capital gains tax.`,
          ),
        );

        gameLogPromises.push(
          this.gameLogService.createGameLog({
            game: { connect: { id: phase.gameId } },
            content: `Player ${player.nickname} has paid capital gains tax of $${taxAmount}.`,
          }),
        );
      }
    }

    // Await all player updates and game logs concurrently
    await Promise.all(playerUpdatePromises);
    await Promise.all(gameLogPromises);

    // Create an entry for capital gains updates
    await this.capitalGainsService.createManyCapitalGains(capitalGainsUpdates);

    return capitalGainsUpdates;
  }

  /**
   * Tax capital gains based on the income the player has collected throughout the turn.
   * @param phase
   * @returns
   */
  async resolveCapitalGainsViaTurnIncome(phase: Phase) {
    //get game
    const game = await this.gamesService.game({ id: phase.gameId });
    if (!game) {
      throw new Error('Game not found');
    }
    //get all players
    const players = await this.playersService.players({
      where: { gameId: game.id },
    });
    if (!players) {
      throw new Error('Players not found');
    }
    const playerIds = players.map((player) => player.id);
    const playersIncome = await this.getTurnIncome(playerIds, game.currentTurn);
    
    // If no income transactions found, skip capital gains calculation
    // This can happen in modern operations if all revenue was retained or no dividends were paid
    if (playersIncome.length === 0) {
      console.log(`[resolveCapitalGainsViaTurnIncome] No income transactions found for turn ${game.currentTurn}, skipping capital gains`);
      return;
    }
    
    //charge capital gains
    const capitalGainsUpdates = [];
    const playerUpdatePromises = [];
    const gameLogPromises = [];
    for (const { playerId, totalIncome } of playersIncome) {
      // Find the appropriate tax tier
      const tier = CapitalGainsTiers.find(
        (tier) =>
          totalIncome >= tier.minNetWorth && totalIncome <= tier.maxNetWorth,
      );
      //if no tier is found, skip the player
      if (!tier) {
        console.error(`No tax tier found for total income: ${totalIncome}`);
        continue;
      }
      //calculate tax amount
      let taxAmount = totalIncome * (tier.taxPercentage / 100);
      //round tax amount down
      taxAmount = Math.floor(taxAmount);
      //get player
      const player = players.find((p) => p.id === playerId);
      //if player is not found, skip the player
      if (!player) {
        console.error(`Player not found: ${playerId}`);
        continue;
      }
      //if tax amount is greater than 0, charge the player
      if (taxAmount > 0) {
        // Update player cash on hand
        capitalGainsUpdates.push({
          playerId,
          capitalGains: taxAmount,
          gameId: phase.gameId,
          gameTurnId: phase.gameTurnId,
          taxPercentage: tier.taxPercentage,
        });
        //charge the player
        playerUpdatePromises.push(
          this.playerRemoveMoney(
            phase.gameId,
            phase.gameTurnId,
            phase.id,
            playerId,
            taxAmount,
            EntityType.BANK,
            `Capital gains tax.`,
          ),
        );
        //create game log
        gameLogPromises.push(
          this.gameLogService.createGameLog({
            game: { connect: { id: phase.gameId } },
            content: `Player ${player.nickname} has paid capital gains tax of $${taxAmount}.`,
          }),
        );
      }
    }
    //resolve promises
    await Promise.all(playerUpdatePromises);
    await Promise.all(gameLogPromises);
    //create capital gains entries
    await this.capitalGainsService.createManyCapitalGains(capitalGainsUpdates);
  }

  /**
   * Calculate income for a turn where income is all transactions that have earned the player money.
   * @param playerIds
   * @param turnId
   * @returns Array of player incomes
   */
  async getTurnIncome(playerIds: string[], turnId: string) {
    // Fetch players
    const players = await this.playersService.players({
      where: { id: { in: playerIds } },
    });

    if (!players || players.length === 0) {
      throw new Error('Players not found');
    }

    const entityIds = players
      .map((player) => player.entityId)
      .filter(Boolean) as string[]; // Ensure no null or undefined values

    // Fetch transactions for the turn and filter by types
    const transactions = await this.transactionService.listTransactions({
      where: {
        gameTurnId: turnId,
        toEntity: {
          entityType: EntityType.PLAYER,
          id: { in: entityIds },
        },
        OR: [
          { transactionSubType: TransactionSubType.DIVIDEND },
          { transactionSubType: TransactionSubType.MARKET_SELL },
          { transactionSubType: TransactionSubType.SHORT },
          { transactionSubType: TransactionSubType.OPTION_CALL_EXERCISE },
          { transactionSubType: TransactionSubType.TRANCHE },
        ],
      },
    });

    // If no transactions found, return empty array (no income to tax)
    // This can happen in modern operations if all revenue was retained or no dividends were paid
    if (!transactions || transactions.length === 0) {
      return [];
    }

    // Group transactions by player entityId
    const groupedTransactions = transactions.reduce<{
      [key: string]: Transaction[];
    }>((acc, transaction) => {
      const playerId = transaction.toEntity?.Player?.id;
      if (!playerId) return acc;

      if (!acc[playerId]) {
        acc[playerId] = [];
      }
      acc[playerId].push(transaction);
      return acc;
    }, {});

    // Calculate total income per player
    return Object.entries(groupedTransactions).map(
      ([playerId, transactions]) => {
        const totalIncome = transactions.reduce(
          (acc, transaction) => acc + transaction.amount,
          0,
        );
        return { playerId, totalIncome };
      },
    );
  }

  async createOperatingRoundCompanyActions(phase: Phase) {
    if (!phase.operatingRoundId) {
      throw new Error('Operating round not found');
    }
    const operatingRound =
      await this.operatingRoundService.operatingRoundWithProductionResults({
        id: phase.operatingRoundId,
      });

    if (!operatingRound) {
      console.error('Operating round not found');
      return;
    }

    const companies = await this.companyService.companies({
      where: { gameId: phase.gameId, status: CompanyStatus.ACTIVE },
    });

    // Fetch existing company actions for the current operating round
    const existingCompanyActions = await this.prisma.companyAction.findMany({
      where: {
        operatingRoundId: phase.operatingRoundId,
        companyId: {
          in: companies.map((company) => company.id),
        },
      },
    });

    // Create a set of existing company action company IDs for quick lookup
    const existingCompanyActionCompanyIds = new Set(
      existingCompanyActions.map((action) => action.companyId),
    );

    // Filter out companies that already have actions
    let companyActions = companies
      .filter((company) => !existingCompanyActionCompanyIds.has(company.id))
      .map((company) => ({
        companyId: company.id,
        operatingRoundId: phase.operatingRoundId,
      }));

    if (companyActions.length === 0) {
      return;
    }
    //ensure there are no duplicate companyIds in the companyActions array
    companyActions = companyActions.filter(
      (companyAction, index, self) =>
        index ===
        self.findIndex((t) => t.companyId === companyAction.companyId),
    );

    try {
      await this.prisma.companyAction.createMany({
        data: companyActions,
      });
    } catch (error) {
      console.error('Error creating company actions', error);
    }
  }

  async calculateAndDistributeDividends(phase: Phase) {
    if (!phase.operatingRoundId) {
      throw new Error('Operating round not found');
    }
    const operatingRound =
      await this.operatingRoundService.operatingRoundWithProductionResults({
        id: phase.operatingRoundId,
      });

    if (!operatingRound) {
      console.error('Operating round not found');
      return;
    }

    const productionResults = operatingRound.productionResults;

    for (const result of productionResults) {
      const company = result.Company;
      let revenueDistribution = result.revenueDistribution;

      if (!revenueDistribution) {
        console.error(
          'Revenue distribution not found, setting to default retain',
        );
        revenueDistribution = RevenueDistribution.RETAINED;
      }

      const revenue = result.revenue;
      if (revenue == 0) {
        console.error('No revenue to distribute');
        continue;
      }

      let dividend = 0;
      let moneyToCompany = 0;
      let moneyFromBank;

      switch (revenueDistribution) {
        case RevenueDistribution.DIVIDEND_FULL:
          dividend = revenue / company.Share.length;
          break;
        case RevenueDistribution.DIVIDEND_FIFTY_FIFTY:
          dividend = Math.floor(revenue / 2) / company.Share.length;
          moneyToCompany = Math.floor(revenue / 2);
          break;
        case RevenueDistribution.RETAINED:
          moneyToCompany = revenue;
          break;
        default:
          continue;
      }

      moneyFromBank = revenue;

      if (dividend > 0) {
        //filter shares by location IPO
        // TODO: After some thought, I don't believe it makes sense to pay the company any dividends for shares in IPO or OM
        // const companyShares = company.Share.filter(
        //   (share) => share.location === ShareLocation.IPO,
        // );
        // const companyDividendTotal = Math.floor(
        //   dividend * companyShares.length,
        // );
        // const updatedCompany = await this.companyService.updateCompany({
        //   where: { id: company.id },
        //   data: { cashOnHand: company.cashOnHand + companyDividendTotal },
        // });
        //if company has positive cash on hand, make sure it's active
        // if (updatedCompany.cashOnHand > 0) {
        //   await this.companyService.updateCompany({
        //     where: { id: company.id },
        //     data: { status: CompanyStatus.ACTIVE },
        //   });
        // }
        // this.gameLogService.createGameLog({
        //   game: { connect: { id: phase.gameId } },
        //   content: `Company ${company.name} has received dividends of ${companyDividendTotal}.`,
        // });
        //group shares by player id
        const groupedShares = company.Share.filter(
          (share) => share.location === ShareLocation.PLAYER,
        );
        const groupedSharesByPlayerId = groupedShares.reduce<{
          [key: string]: Share[];
        }>((acc, share) => {
          if (!share.playerId) {
            return acc;
          }
          if (!acc[share.playerId]) {
            acc[share.playerId] = [];
          }
          acc[share.playerId].push(share);
          return acc;
        }, {});

        //update player cash on hand
        const sharePromises = Object.entries(groupedSharesByPlayerId).map(
          async ([playerId, shares]) => {
            const player = await this.playersService.player({
              id: playerId,
            });
            if (!player) {
              console.error('Player not found calculateAndDistributeDividends');
              return;
            }
            const dividendTotal = Math.floor(dividend * shares.length);
            await this.playerAddMoney({
              gameId: phase.gameId,
              gameTurnId: phase.gameTurnId,
              phaseId: phase.id,
              playerId: player.id,
              amount: dividendTotal,
              fromEntity: EntityType.BANK,
              description: 'Dividends.',
              transactionSubType: TransactionSubType.DIVIDEND,
            });
            this.gameLogService.createGameLog({
              game: { connect: { id: phase.gameId } },
              content: `Player ${player.nickname} has received dividends of $${dividendTotal}.`,
            });
          },
        );
        await Promise.all(sharePromises);
      }

      if (moneyToCompany > 0) {
        const companyUpdated = await this.companyService.updateCompany({
          where: { id: company.id },
          data: { cashOnHand: company.cashOnHand + moneyToCompany },
        });
        //if companyUpdated has positive cash on hand, make sure it's active
        if (companyUpdated.cashOnHand > 0) {
          await this.companyService.updateCompany({
            where: { id: company.id },
            data: { status: CompanyStatus.ACTIVE },
          });
        }
        this.gameLogService.createGameLog({
          game: { connect: { id: phase.gameId } },
          content: `Company ${company.name} has retained $${moneyToCompany}.`,
        });
      }

      const game = await this.gamesService.game({ id: phase.gameId });
      if (!game) {
        console.error('Game not found');
        continue;
      }

      await this.gamesService.updateGameState({
        where: { id: phase.gameId },
        data: { bankPoolNumber: game.bankPoolNumber - moneyFromBank },
      });
    }
  }

  /**
   * Calculate and distribute dividends for modern operations (using FactoryProduction records)
   * This method is similar to calculateAndDistributeDividends but works with FactoryProduction
   * instead of ProductionResult records.
   */
  async calculateAndDistributeDividendsModern(phase: Phase) {
    console.log('calculateAndDistributeDividendsModern', phase);
    if (!phase.operatingRoundId) {
      throw new Error('Operating round not found');
    }
    if (!phase.gameTurnId) {
      throw new Error('Game turn not found');
    }

    const operatingRound =
      await this.operatingRoundService.operatingRoundWithRevenueDistributionVotes(
        {
          id: phase.operatingRoundId,
        },
      );
    console.log('operatingRound', operatingRound);

    if (!operatingRound) {
      console.error('Operating round not found');
      return;
    }

    // Group votes by company
    type GroupedByCompany = {
      [key: string]: RevenueDistributionVote[];
    };

    const groupedVotes =
      operatingRound?.revenueDistributionVotes.reduce<GroupedByCompany>(
        (acc, vote) => {
          if (!acc[vote.companyId]) {
            acc[vote.companyId] = [vote];
          } else {
            acc[vote.companyId].push(vote);
          }
          return acc;
        },
        {},
      );
    console.log('groupedVotes', groupedVotes);
    if (!groupedVotes) {
      console.error('No grouped votes found');
      return;
    }

    const game = await this.gamesService.game({ id: phase.gameId });
    if (!game) {
      console.error('Game not found');
      return;
    }

    // Get player priorities for tie-breaking
    // TODO: This is not working as expected.  We need to get the player priorities for the current turn.  It appears our assumption that the player priorities are the same for all turns is incorrect.
    const playerPriorities =
      await this.playerPriorityService.listPlayerPriorities({
        where: { gameTurnId: phase.gameTurnId },
      });
    playerPriorities.sort((a, b) => a.priority - b.priority);
    console.log('playerPriorities', playerPriorities);
    // Process each company
    for (const [companyId, votes] of Object.entries(groupedVotes)) {
      // Filter out votes with weight 0
      const validVotes = votes.filter((vote) => vote.weight > 0);
      if (validVotes.length === 0) {
        continue;
      }

      // Calculate vote counts
      const voteCount: { [key: string]: number } = {};
      validVotes.forEach((vote) => {
        if (!voteCount[vote.revenueDistribution]) {
          voteCount[vote.revenueDistribution] = 0;
        }
        voteCount[vote.revenueDistribution] += vote.weight;
      });

      // Get the option with the most votes
      const maxVotes = Math.max(...Object.values(voteCount));
      const maxVoteOptions = Object.keys(voteCount).filter(
        (key) => voteCount[key] === maxVotes,
      );
      console.log('maxVoteOptions', maxVoteOptions);

      // Resolve tie using player priority
      let revenueDistribution: RevenueDistribution | null = null;
      for (const player of playerPriorities) {
        const playerVote = validVotes.find(
          (vote) =>
            vote.playerId === player.playerId &&
            maxVoteOptions.includes(vote.revenueDistribution),
        );
        if (playerVote) {
          revenueDistribution = playerVote.revenueDistribution;
          break;
        }
      }
      console.log('revenueDistribution', revenueDistribution);

      // Default to RETAINED if no vote found
      if (!revenueDistribution) {
        revenueDistribution = RevenueDistribution.RETAINED;
      }

      // OPTIMIZATION: Fetch company and revenue in parallel
      const [company, totalRevenue] = await Promise.all([
        this.companyService.companyWithRelations({
          id: companyId,
        }),
        this.factoryProductionService.getCompanyTurnRevenue(
          companyId,
          phase.gameTurnId,
        ),
      ]);
      
      if (!company) {
        console.error(`Company ${companyId} not found`);
        continue;
      }
      console.log('totalRevenue', totalRevenue);
      if (totalRevenue === 0) {
        console.log(`No revenue to distribute for company ${company.name}`);
        continue;
      }

      // Handle negative revenue (must be retained)
      if (totalRevenue < 0) {
        revenueDistribution = RevenueDistribution.RETAINED;
      }

      // Each company has 10 shares in rotation
      const TOTAL_SHARES_IN_ROTATION = 10;

      // Filter shares: only PLAYER and OPEN_MARKET shares get dividends (not IPO)
      const playerShares = company.Share.filter(
        (share) => share.location === ShareLocation.PLAYER && share.playerId,
      );
      const openMarketShares = company.Share.filter(
        (share) => share.location === ShareLocation.OPEN_MARKET,
      );
      const sharesEligibleForDividends = playerShares.length + openMarketShares.length;

      // Calculate dividend and company retention
      let dividend = 0;
      let moneyToCompany = 0;
      const moneyFromBank = totalRevenue;

      // Only calculate dividends if there are shares eligible for dividends
      if (sharesEligibleForDividends === 0) {
        console.log(`No shares eligible for dividends found for company ${company.name}, retaining all revenue`);
        moneyToCompany = totalRevenue;
      } else {
        console.log('revenueDistribution', revenueDistribution);
        console.log('playerShares', playerShares.length, 'openMarketShares', openMarketShares.length);
        switch (revenueDistribution) {
          case RevenueDistribution.DIVIDEND_FULL:
            // For full dividend, distribute ALL revenue to eligible shares
            // Dividend per share = revenue / eligible shares (rounded down)
            dividend = Math.floor(totalRevenue / sharesEligibleForDividends);
            // Company retains 0 - any remainder from rounding will be distributed to shareholders
            moneyToCompany = 0;
            break;
          case RevenueDistribution.DIVIDEND_FIFTY_FIFTY:
            // Half revenue per share = (revenue / 2) / 10 (rounded down)
            dividend = Math.floor(Math.floor(totalRevenue / 2) / TOTAL_SHARES_IN_ROTATION);
            // Total dividends paid = per share * number of eligible shares
            // Company retains the remainder (which should be approximately half)
            moneyToCompany = totalRevenue - (dividend * sharesEligibleForDividends);
            break;
          case RevenueDistribution.RETAINED:
            moneyToCompany = totalRevenue;
            break;
          default:
            moneyToCompany = totalRevenue;
            break;
        }
      }
      console.log('dividend', dividend);
      console.log('moneyToCompany', moneyToCompany);
      
      // Calculate total dividends to be paid
      let totalDividendsPaidToPlayers = 0;
      let totalDividendsPaidToCompany = 0;
      
      // Distribute dividends to players (BANK → PLAYER)
      if (dividend > 0 && playerShares.length > 0) {
        const groupedSharesByPlayerId = playerShares.reduce<{
          [key: string]: Share[];
        }>((acc, share) => {
          if (!share.playerId) {
            console.warn(`Share ${share.id} has no playerId, skipping`);
            return acc;
          }
          if (!acc[share.playerId]) {
            acc[share.playerId] = [];
          }
          acc[share.playerId].push(share);
          return acc;
        }, {});

        console.log(`[calculateAndDistributeDividendsModern] Company ${company.name}: totalRevenue=${totalRevenue}, dividend per share=${dividend}, playerShares=${playerShares.length}, players with shares=${Object.keys(groupedSharesByPlayerId).length}`);

        // Calculate total dividends to be paid to players
        totalDividendsPaidToPlayers = Object.entries(groupedSharesByPlayerId).reduce(
          (total, [, shares]) => total + Math.floor(dividend * shares.length),
          0
        );

        // For full dividend, calculate remainder from rounding and distribute it
        let remainderToDistribute = 0;
        if (revenueDistribution === RevenueDistribution.DIVIDEND_FULL) {
          const totalDistributedToPlayers = totalDividendsPaidToPlayers;
          const totalDistributedToOpenMarket = openMarketShares.length > 0 
            ? Math.floor(dividend * openMarketShares.length) 
            : 0;
          const totalDistributed = totalDistributedToPlayers + totalDistributedToOpenMarket;
          remainderToDistribute = totalRevenue - totalDistributed;
        }

        // Update player cash on hand
        const sharePromises = Object.entries(groupedSharesByPlayerId).map(
          async ([playerId, shares], index) => {
            const player = await this.playersService.player({
              id: playerId,
            });
            if (!player) {
              console.error(`[calculateAndDistributeDividendsModern] Player ${playerId} not found`);
              return;
            }
            let dividendTotal = Math.floor(dividend * shares.length);
            // For full dividend, add remainder to first player to ensure company retains 0
            if (revenueDistribution === RevenueDistribution.DIVIDEND_FULL && index === 0 && remainderToDistribute > 0) {
              dividendTotal += remainderToDistribute;
            }
            console.log(`[calculateAndDistributeDividendsModern] Distributing $${dividendTotal} to player ${player.nickname} (${shares.length} shares)`);
            
            // Update player cash and bank pool (playerAddMoney creates BANK → PLAYER transaction)
            await this.playerAddMoney({
              gameId: phase.gameId,
              gameTurnId: phase.gameTurnId,
              phaseId: phase.id,
              playerId: player.id,
              amount: dividendTotal,
              fromEntity: EntityType.BANK,
              description: `Dividend payment: $${dividendTotal} to ${player.nickname} (${shares.length} shares) from ${company.name}`,
              transactionSubType: TransactionSubType.DIVIDEND,
            });
            await this.gameLogService.createGameLog({
              game: { connect: { id: phase.gameId } },
              content: `Player ${player.nickname} has received dividends of $${dividendTotal} from ${company.name}.`,
            });
          },
        );
        await Promise.all(sharePromises);
        
        // Update totalDividendsPaidToPlayers to include remainder
        if (revenueDistribution === RevenueDistribution.DIVIDEND_FULL && remainderToDistribute > 0) {
          totalDividendsPaidToPlayers += remainderToDistribute;
        }
      }
      
      // Distribute dividends to company for open market shares (BANK → COMPANY)
      if (dividend > 0 && openMarketShares.length > 0) {
        totalDividendsPaidToCompany = Math.floor(dividend * openMarketShares.length);
        console.log(`[calculateAndDistributeDividendsModern] Distributing $${totalDividendsPaidToCompany} to company ${company.name} for ${openMarketShares.length} open market shares`);
        
        // Create transaction for dividend payment (BANK → COMPANY)
        if (company.entityId) {
          try {
            await this.transactionService.createTransactionEntityToEntity({
              gameId: phase.gameId,
              gameTurnId: phase.gameTurnId,
              phaseId: phase.id,
              fromEntityType: EntityType.BANK,
              toEntityType: EntityType.COMPANY,
              toEntityId: company.entityId,
              amount: totalDividendsPaidToCompany,
              transactionType: TransactionType.CASH,
              transactionSubType: TransactionSubType.DIVIDEND,
              toCompanyId: companyId,
              companyInvolvedId: companyId,
              description: `Dividend payment: $${totalDividendsPaidToCompany} to ${company.name} for ${openMarketShares.length} open market shares`,
            });
          } catch (error) {
            console.error('Failed to create dividend transaction for open market shares:', error);
          }
        }
        
        // Update company cash and bank pool
        await this.prisma.game.update({
          where: { id: phase.gameId },
          data: {
            bankPoolNumber: {
              decrement: totalDividendsPaidToCompany,
            },
          },
        });
        await this.companyService.updateCompany({
          where: { id: company.id },
          data: {
            cashOnHand: {
              increment: totalDividendsPaidToCompany,
            },
          },
        });
      }
      
      // Company cash is already updated:
      // - totalRevenue was added in earnings call phase
      // - Open market dividends were added above (BANK → COMPANY)
      // - Company retains moneyToCompany (which is already in cash since totalRevenue was received)
      // No additional cash update needed here

      // Update company cash on hand (for retained revenue when no dividends)
      if (moneyToCompany !== 0 && (dividend === 0 || playerShares.length === 0)) {
        const companyUpdated = await this.companyService.updateCompany({
          where: { id: company.id },
          data: { cashOnHand: company.cashOnHand + moneyToCompany },
        });
        // If company has positive cash on hand, make sure it's active
        if (companyUpdated.cashOnHand > 0) {
          await this.companyService.updateCompany({
            where: { id: company.id },
            data: { status: CompanyStatus.ACTIVE },
          });
        }
        
        // Create transaction for revenue retention
        if (moneyToCompany > 0 && company.entityId) {
          try {
            await this.transactionService.createTransactionEntityToEntity({
              gameId: phase.gameId,
              gameTurnId: phase.gameTurnId,
              phaseId: phase.id,
              fromEntityType: EntityType.BANK,
              toEntityType: EntityType.COMPANY,
              toEntityId: company.entityId,
              amount: moneyToCompany,
              transactionType: TransactionType.CASH,
              transactionSubType: TransactionSubType.OPERATING_COST,
              toCompanyId: companyId,
              companyInvolvedId: companyId,
              description: `Revenue retention: $${moneyToCompany} retained by ${company.name}`,
            });
          } catch (error) {
            console.error('Failed to create revenue retention transaction:', error);
          }
        }
        
        if (moneyToCompany > 0) {
          this.gameLogService.createGameLog({
            game: { connect: { id: phase.gameId } },
            content: `Company ${company.name} has retained $${moneyToCompany}.`,
          });
        } else {
          this.gameLogService.createGameLog({
            game: { connect: { id: phase.gameId } },
            content: `Company ${company.name} has lost $${Math.abs(moneyToCompany)} from cash on hand.`,
          });
        }
      }
      console.log('moneyFromBank', moneyFromBank);
      // Update bank pool
      await this.gamesService.updateGameState({
        where: { id: phase.gameId },
        data: { bankPoolNumber: game.bankPoolNumber - moneyFromBank },
      });
    }
  }

  async handleStockActionReveal(phase: Phase) {
    if (!phase.stockRoundId && !phase.stockSubRoundId) {
      throw new Error('Stock round ID or stock sub round ID not found');
    }
    try {
      await this.playerOrderService.updateManyPlayerOrders({
        where: {
          stockRoundId: phase.stockRoundId || '',
          stockSubRoundId: phase.stockSubRoundId || '',
        },
        data: {
          isConcealed: false,
        },
      });
    } catch (error) {
      console.error('Error revealing stock actions', error);
    }
  }

  async handleNewSubStockActionRound(phase: Phase): Promise<Phase> {
    if (!phase.stockRoundId) {
      throw new Error('Stock round ID not found');
    }
    //get the stock round
    const stockRound = await this.stockRoundService.doesStockRoundExist({
      id: phase.stockRoundId,
    });
    if (!stockRound) {
      throw new Error('Stock round not found');
    }
    //get latest stock sub round
    const latestStockSubRound =
      await this.stockRoundService.getCurrentSubStockRound(phase.stockRoundId);
    //create stock sub round
    try {
      const subStockRound = await this.stockSubRoundService.createStockSubRound(
        {
          roundNumber: latestStockSubRound
            ? latestStockSubRound?.roundNumber + 1
            : 1,
          StockRound: { connect: { id: phase.stockRoundId } },
          Game: { connect: { id: phase.gameId } },
          GameTurn: { connect: { id: phase.gameTurnId } },
        },
      );
      //update the phase with the new sub stock round
      return await this.phaseService.updatePhase({
        where: { id: phase.id },
        data: { StockSubRound: { connect: { id: subStockRound.id } } },
      });
    } catch (error) {
      console.error('Error creating stock sub round', error);
      throw new Error('Error creating stock sub round');
    }
  }

  async moveCompanyForwardOnCompanyAwardTrack(
    companyId: string,
    gameId: string,
    awardTrackType: AwardTrackType,
  ) {
    //get award track of type with game id
    const awardTracks =
      await this.companyAwardTrackService.listCompanyAwardTracks({
        where: { gameId, awardTrackType },
      });
    if (!awardTracks || awardTracks.length === 0) {
      console.error('No award tracks found');
      return;
    }
    const awardTrackFound = awardTracks[0];
    //get the spaces for the award track
    const awardTrackSpaces =
      await this.companyAwardTrackSpaceService.listCompanyAwardTrackSpaces({
        where: { awardTrackId: awardTrackFound.id },
      });
    if (!awardTrackSpaces || awardTrackSpaces.length === 0) {
      console.error('No award track spaces found');
      return;
    }
    //get the companyspace
    const companySpace =
      await this.companyAwardTrackSpaceService.findSpaceForCompany(
        awardTrackFound.id,
        companyId,
      );
    if (!companySpace) {
      console.error('Company space not found');
      return;
    }
    //move company forward on space
    return this.companyAwardTrackSpaceService.moveCompanyForwardOnSpace(
      companyId,
      companySpace,
      awardTrackFound.awardTrackType,
    );
  }

  /**
   * Resolve the company action.
   *
   * @param phase
   */
  async resolveCompanyAction(phase: Phase) {
    //get the company
    const company = await this.companyService.company({
      id: phase.companyId || '',
    });
    if (!company) {
      throw new Error('Company not found');
    }
    if (!phase.operatingRoundId) {
      throw new Error('Operating round not found');
    }
    if (!phase.companyId) {
      throw new Error('Company ID not found');
    }
    if (!phase.gameTurnId) {
      throw new Error('Game turn ID not found');
    }
    // Get the company action(s)
    let companyActions = await this.prisma.companyAction.findMany({
      where: {
        operatingRoundId: phase.operatingRoundId,
        companyId: phase.companyId,
      },
      include: {
        Company: true,
      },
    });

    // If no company actions exist, create a VETO action
    if (companyActions.length === 0) {
      const newCompanyAction =
        await this.companyActionService.createCompanyAction({
          Company: { connect: { id: phase.companyId } },
          GameTurn: { connect: { id: phase.gameTurnId } },
          OperatingRound: { connect: { id: phase.operatingRoundId } },
          action: OperatingRoundAction.VETO,
          resolved: true,
        });

      companyActions.push(newCompanyAction);
    }

    for (let companyAction of companyActions) {
      if (!companyAction.action) {
        companyAction = await this.companyActionService.updateCompanyAction({
          where: { id: companyAction.id },
          data: { action: OperatingRoundAction.VETO },
        });
      }

      // Mark the company action as resolved
      await this.companyActionService.updateCompanyAction({
        where: { id: companyAction.id },
        data: { resolved: true },
      });

      let payForCompanyAction = true;
      // Handle the specific company action
      switch (companyAction.action) {
        case OperatingRoundAction.SHARE_ISSUE:
          await this.resolveIssueShares(companyAction);
          await this.moveCompanyForwardOnCompanyAwardTrack(
            company.id,
            phase.gameId,
            AwardTrackType.CATALYST,
          );
          break;
        case OperatingRoundAction.MARKETING:
          await this.resolveMarketingAction(companyAction);
          await this.moveCompanyForwardOnCompanyAwardTrack(
            company.id,
            phase.gameId,
            AwardTrackType.MARKETING,
          );
          break;
        case OperatingRoundAction.MARKETING_SMALL_CAMPAIGN:
          await this.moveCompanyForwardOnCompanyAwardTrack(
            company.id,
            phase.gameId,
            AwardTrackType.MARKETING,
          );
          await this.resolveMarketingSmallCampaignAction(companyAction);
          break;
        case OperatingRoundAction.SHARE_BUYBACK:
          payForCompanyAction = await this.resolveShareBuyback(companyAction);
          break;
        case OperatingRoundAction.EXPANSION:
          await this.expandCompany(companyAction);
          break;
        case OperatingRoundAction.DOWNSIZE:
          await this.downsizeCompany(companyAction);
          break;
        case OperatingRoundAction.SPEND_PRESTIGE:
          await this.spendPrestige(companyAction);
          break;
        case OperatingRoundAction.INCREASE_PRICE:
          await this.increasePrice(companyAction);
          break;
        case OperatingRoundAction.DECREASE_PRICE:
          await this.decreasePrice(companyAction);
          break;
        case OperatingRoundAction.RESEARCH:
          await this.research(companyAction);
          await this.moveCompanyForwardOnCompanyAwardTrack(
            company.id,
            phase.gameId,
            AwardTrackType.RESEARCH,
          );
          break;
        case OperatingRoundAction.LOAN:
          await this.companyLoan(companyAction);
          break;
        case OperatingRoundAction.LOBBY:
          await this.lobbyCompany(companyAction);
          await this.moveCompanyForwardOnCompanyAwardTrack(
            company.id,
            phase.gameId,
            AwardTrackType.CATALYST,
          );
          break;
        case OperatingRoundAction.OUTSOURCE:
          await this.outsourceCompany(companyAction);
          break;
        case OperatingRoundAction.LICENSING_AGREEMENT:
          await this.licensingAgreement(companyAction);
          break;
        case OperatingRoundAction.VISIONARY:
          await this.visionary(companyAction);
          break;
        case OperatingRoundAction.STRATEGIC_RESERVE:
          break;
        case OperatingRoundAction.RAPID_EXPANSION:
          await this.rapidExpansion(companyAction);
          break;
        case OperatingRoundAction.FASTTRACK_APPROVAL:
          await this.fasttrackApprovalCompany(companyAction);
          break;
        case OperatingRoundAction.PRICE_FREEZE:
          break;
        case OperatingRoundAction.REBRAND:
          await this.rebrand(companyAction);
          break;
        case OperatingRoundAction.SURGE_PRICING:
          break;
        case OperatingRoundAction.EXTRACT:
          await this.extract(companyAction);
          break;
        case OperatingRoundAction.MANUFACTURE:
          await this.manufacture(companyAction);
          break;
        case OperatingRoundAction.VETO:
          console.warn('VETO action encountered');
          break;
        default:
          console.warn(`Unknown action encountered: ${companyAction.action}`);
          break;
      }
      if (payForCompanyAction) {
        // Pay for the company action
        try {
          await this.payForCompanyAction(companyAction);
        } catch (error) {
          console.error(
            'Error paying for company action, vetoing action:',
            error,
          );
          companyAction = await this.companyActionService.updateCompanyAction({
            where: { id: companyAction.id },
            data: { action: OperatingRoundAction.VETO },
          });
        }
      }
    }
  }

  /**
   * The company gains a bonus to it's unit price.
   * @param companyAction
   */
  async licensingAgreement(companyAction: CompanyAction) {
    //get the company
    const company = await this.companyService.company({
      id: companyAction.companyId,
    });
    if (!company) {
      throw new Error('Company not found');
    }
    //increase the unit price of the company
    await this.companyService.updateCompany({
      where: { id: company.id },
      data: {
        unitPrice: company.unitPrice + LICENSING_AGREEMENT_UNIT_PRICE_BONUS,
      },
    });
    //game log
    this.gameLogService.createGameLog({
      game: { connect: { id: company.gameId } },
      content: `Company ${company.name} has gained a unit price bonus of $${LICENSING_AGREEMENT_UNIT_PRICE_BONUS}.`,
    });
  }
  /**
   *  Gain this action during the Company Action phase: The company gains 1 temporary supply and a random active
   *  insolvent Industrials sector company gains one temporary supply.
   * @param companyAction
   */
  async extract(companyAction: CompanyAction) {
    //get the company
    const company = await this.companyService.company({
      id: companyAction.companyId,
    });
    if (!company) {
      throw new Error('Company not found');
    }
    //get all sectors
    const sectors = await this.sectorService.sectors({
      where: { gameId: company.gameId },
    });
    if (!sectors) {
      throw new Error('Sectors not found');
    }
    const industrialsSectorId = sectors.find(
      (sector) => sector.sectorName == SectorName.MATERIALS,
    )?.id;
    if (industrialsSectorId) {
      //get all active or insolvent industrials companies
      const activeInsolventIndustrialsCompanies =
        await this.companyService.companies({
          where: {
            gameId: company.gameId,
            OR: [
              { status: CompanyStatus.INSOLVENT },
              { status: CompanyStatus.ACTIVE },
            ],
          },
        });
      if (!activeInsolventIndustrialsCompanies) {
        throw new Error('Active insolvent industrials companies not found');
      }
      //pick a random company
      const randomCompany =
        activeInsolventIndustrialsCompanies[
          Math.floor(Math.random() * activeInsolventIndustrialsCompanies.length)
        ];
      //increase supply for the random company
      await this.companyService.updateCompany({
        where: { id: randomCompany.id },
        data: { supplyCurrent: randomCompany.supplyCurrent + 1 },
      });

      //game log
      this.gameLogService.createGameLog({
        game: { connect: { id: company.gameId } },
        content: `Company ${randomCompany.name} has gained 1 temporary supply.`,
      });
    }
    //increase supply for the company
    await this.companyService.updateCompany({
      where: { id: company.id },
      data: { supplyCurrent: company.supplyCurrent + 1 },
    });

    // game log
    this.gameLogService.createGameLog({
      game: { connect: { id: company.gameId } },
      content: `Company ${company.name} has gained 1 temporary supply.`,
    });
  }

  /**
   * Gain this action during the Company Action phase: The company gains 1
   * temporary supply and a random active insolvent Materials sector company
   * gains one temporary supply.
   * @param companyAction
   */
  async manufacture(companyAction: CompanyAction) {
    //get the company
    const company = await this.companyService.company({
      id: companyAction.companyId,
    });
    if (!company) {
      throw new Error('Company not found');
    }
    //get all sectors
    const sectors = await this.sectorService.sectors({
      where: { gameId: company.gameId },
    });
    if (!sectors) {
      throw new Error('Sectors not found');
    }
    //materials sector id
    const materialsSectorId = sectors.find(
      (sector) => sector.sectorName == SectorName.MATERIALS,
    )?.id;
    if (!materialsSectorId) {
      //get all active or insolvent materials companies
      const activeInsolventMaterialsCompanies =
        await this.companyService.companies({
          where: {
            gameId: company.gameId,
            sectorId: materialsSectorId,
            OR: [
              { status: CompanyStatus.INSOLVENT },
              { status: CompanyStatus.ACTIVE },
            ],
          },
        });
      if (!activeInsolventMaterialsCompanies) {
        throw new Error('Active insolvent materials companies not found');
      }
      //pick a random company
      const randomCompany =
        activeInsolventMaterialsCompanies[
          Math.floor(Math.random() * activeInsolventMaterialsCompanies.length)
        ];
      //increase supply for the random company
      await this.companyService.updateCompany({
        where: { id: randomCompany.id },
        data: { supplyCurrent: randomCompany.supplyCurrent + 1 },
      });
      //game log
      this.gameLogService.createGameLog({
        game: { connect: { id: company.gameId } },
        content: `Company ${randomCompany.name} has gained 1 temporary supply.`,
      });
    }
    //increase supply for the company
    await this.companyService.updateCompany({
      where: { id: company.id },
      data: { supplyCurrent: company.supplyCurrent + 1 },
    });
    // game log
    this.gameLogService.createGameLog({
      game: { connect: { id: company.gameId } },
      content: `Company ${company.name} has gained 1 temporary supply.`,
    });
  }

  /**
   * The company gains +1 temporary demand, +1 permanent demand and a $40 increase in price
   * @param companyAction
   * @returns
   */
  async rebrand(companyAction: CompanyAction) {
    //get the company
    const company = await this.companyService.company({
      id: companyAction.companyId,
    });
    if (!company) {
      throw new Error('Company not found');
    }
    //increase demand for the company by 1
    await this.companyService.updateCompany({
      where: { id: company.id },
      data: {
        demandScore: company.demandScore + 1,
        baseDemand: company.baseDemand + 1,
        currentStockPrice: company.unitPrice + 40,
      },
    });
  }
  /**
   * Take up to 3 consumers from each
   * other sector and it to Healthcare, the company gets
   * +2 temporary demand.
   * @param companyAction
   */
  async fasttrackApprovalCompany(companyAction: CompanyAction) {
    //get the company
    const company = await this.companyService.company({
      id: companyAction.companyId,
    });
    if (!company) {
      throw new Error('Company not found');
    }
    //get all sectors
    const sectors = await this.sectorService.sectors({
      where: { gameId: company.gameId },
    });
    if (!sectors) {
      throw new Error('Sectors not found');
    }
    //get the healthcare sector
    const healthcareSector = sectors.find(
      (sector) => sector.sectorName == SectorName.HEALTHCARE,
    );
    if (!healthcareSector) {
      throw new Error('Healthcare sector not found');
    }
    //get all sectors except healthcare
    const otherSectors = sectors.filter(
      (sector) => sector.sectorName !== SectorName.HEALTHCARE,
    );
    //take up to 3 consumers away from otherSectors and add them to healthcare
    let consumerTakenCount = 0;
    const consumerPromises = otherSectors.map(async (sector) => {
      const consumersTaken = Math.max(
        FASTTRACK_APPROVAL_AMOUNT_CONSUMERS,
        sector.consumers,
      );
      const consumersRemaining = Math.max(0, sector.consumers - consumersTaken);
      consumerTakenCount += consumersTaken;
      return this.sectorService.updateSector({
        where: { id: sector.id },
        data: { consumers: consumersRemaining },
      });
    });
    await Promise.all(consumerPromises);
    //add consumerTakenCount to healthcare
    await this.sectorService.updateSector({
      where: { id: healthcareSector.id },
      data: { consumers: healthcareSector.consumers + consumerTakenCount },
    });
    //increase demand for the company
    await this.companyService.updateCompany({
      where: { id: company.id },
      data: {
        demandScore: company.demandScore + FASTTRACK_APPROVAL_AMOUNT_DEMAND,
      },
    });
  }

  /**
   * The company expands two levels.
   * @param companyAction
   */
  async rapidExpansion(companyAction: CompanyAction) {
    //get the company
    const company = await this.companyService.company({
      id: companyAction.companyId,
    });
    if (!company) {
      throw new Error('Company not found');
    }
    const newTier = getNextCompanyTier(company.companyTier);
    if (!newTier) {
      throw new Error('Company tier not found');
    }
    //get the next tier up
    const newTierUp = getNextCompanyTier(newTier);
    if (!newTierUp) {
      throw new Error('Company tier not found');
    }
    //update the company tier
    await this.companyService.updateCompany({
      where: { id: company.id },
      data: {
        companyTier: newTier,
        supplyMax: company.supplyMax + 2,
      },
    });
  }

  /**
   * Draw 2 research cards and the company gains +1 demand permanently.
   */
  async visionary(companyAction: CompanyAction) {
    //get the company
    const company = await this.companyService.company({
      id: companyAction.companyId,
    });
    if (!company) {
      throw new Error('Company not found');
    }
    //get the research deck
    const researchDeck = await this.researchDeckService.researchDeckFirst({
      where: { gameId: company.gameId },
    });
    if (!researchDeck) {
      throw new Error('Research deck not found');
    }
    //pick 2 random cards
    const randomCards = this.shuffleArray(researchDeck.cards).slice(0, 2);
    //assign these cards to the company
    const cardPromises = randomCards.map((card) =>
      this.cardsService.updateCard(card.id, {
        Company: { connect: { id: company.id } },
      }),
    );
    await Promise.all(cardPromises);
    //increase demand permanently for the company by 1
    await this.companyService.updateCompany({
      where: { id: company.id },
      data: { demandScore: company.baseDemand + 1 },
    });
    //trigger effects of cards
    for (const card of randomCards) {
      await this.triggerCardEffect(card.effect, company);
    }
  }

  async strategicReserve(companyAction: CompanyAction) {}

  /** Increase company currentSupply */
  async outsourceCompany(companyAction: CompanyAction) {
    //get the company
    const company = await this.companyService.company({
      id: companyAction.companyId,
    });
    if (!company) {
      throw new Error('Company not found');
    }
    const companyTierMaxSupply = CompanyTierData[company.companyTier].supplyMax;
    //increase the company temporary supply and set prestige tokens to zero
    await this.companyService.updateCompany({
      where: { id: company.id },
      data: {
        supplyCurrent: Math.min(
          company.supplyCurrent + OURSOURCE_SUPPLY_BONUS,
          companyTierMaxSupply * 2,
        ),
        prestigeTokens: company.prestigeTokens - OUTSOURCE_PRESTIGE_PENALTY,
      },
    });
  }

  /**
   * Lobby the government to increase demand for the sector.
   * This demand decays once per turn.
   * @param companyAction
   */
  async lobbyCompany(companyAction: CompanyAction) {
    //get the company
    const company = await this.companyService.company({
      id: companyAction.companyId,
    });
    if (!company) {
      throw new Error('Company not found');
    }
    const sector = await this.sectorService.sector({
      id: company.sectorId,
    });
    if (!sector) {
      throw new Error('Sector not found');
    }
    //increase demand for the sector
    await this.sectorService.updateSector({
      where: { id: sector.id },
      data: { demandBonus: (sector.demandBonus || 0) + LOBBY_DEMAND_BOOST },
    });
  }

  async resolveMarketingSmallCampaignAction(companyAction: CompanyAction) {
    //get the company
    const company = await this.companyService.company({
      id: companyAction.companyId,
    });
    if (!company) {
      throw new Error('Company not found');
    }
    //increase demand for the company by 2
    await this.companyService.updateCompany({
      where: { id: company.id },
      data: {
        demandScore: company.demandScore + SMALL_MARKETING_CAMPAIGN_DEMAND,
      },
    });
  }

  async companyLoan(companyAction: CompanyAction) {
    //get the company
    const company = await this.companyService.company({
      id: companyAction.companyId,
    });
    if (!company) {
      throw new Error('Company not found');
    }
    //increase the company cash on hand by $500
    await this.companyService.updateCompany({
      where: { id: companyAction.companyId },
      data: { cashOnHand: company.cashOnHand + LOAN_AMOUNT, hasLoan: true },
    });
    //game log
    await this.gameLogService.createGameLog({
      game: { connect: { id: company.gameId } },
      content: `Company ${company.name} has taken a loan of $${LOAN_AMOUNT}.`,
    });
  }

  async research(companyAction: CompanyAction) {
    //get the company
    const company = await this.companyService.companyWithRelations({
      id: companyAction.companyId,
    });
    if (!company) {
      throw new Error('Company not found');
    }
    //get the research deck
    const researchDeck = await this.researchDeckService.researchDeckFirst({
      where: { gameId: company.gameId },
    });
    if (!researchDeck) {
      throw new Error('Research deck not found');
    }
    //filter cards from the deck that do not have a company id
    const cards = researchDeck.cards.filter((card) => !card.companyId);
    //check if this company has the INNOVATION_SURGE effect
    const hasInnovationSurge = company.CompanyActions.some(
      (action) => action.action === OperatingRoundAction.INNOVATION_SURGE,
    );
    if (hasInnovationSurge) {
      //draw two cards
      const randomCards = this.drawResearchCards(
        INNOVATION_SURGE_CARD_DRAW_BONUS,
        company.Sector.sectorName,
        cards,
      );
      //assign these cards to the company
      const cardPromises = randomCards.map((card) =>
        this.cardsService.updateCard(card.id, {
          Company: { connect: { id: company.id } },
        }),
      );
      await Promise.all(cardPromises);
      //trigger effects of cards
      for (const card of randomCards) {
        await this.triggerCardEffect(card.effect, company);
      }
    } else {
      //pick a random card
      const card = this.drawResearchCards(
        1,
        company.Sector.sectorName,
        cards,
      )[0];
      //assign this card to the company
      await this.cardsService.updateCard(card.id, {
        Company: { connect: { id: company.id } },
      });
      //trigger effect
      await this.triggerCardEffect(card.effect, company);
    }
  }

  drawResearchCards(
    amountToDraw: number,
    sectorName: SectorName,
    cards: Card[],
  ): Card[] {
    // Filter out cards that are not in the specified sector
    const filteredCards = cards.filter(
      (card) =>
        card.sector === sectorName || card.sector === SectorName.GENERAL,
    );

    // Shuffle the filtered cards
    const shuffledCards = this.shuffleArray(filteredCards);

    // Draw and return the specified amount of cards
    return shuffledCards.slice(0, amountToDraw);
  }

  async triggerCardEffect(effect: ResearchCardEffect, company: Company) {
    switch (effect) {
      case ResearchCardEffect.GOVERNMENT_GRANT:
        this.governmentGrantCardEffect(company);
        break;
      case ResearchCardEffect.SPECIALIZATION:
        //increase the company prestige by 2
        await this.prestigeIncreaseEffect(company);
        return;
      case ResearchCardEffect.QUALITY_CONTROL:
      case ResearchCardEffect.PRODUCT_DEVELOPMENT:
        this.companySupplyIncreaseEffect(company);
        return;
      case ResearchCardEffect.AUTOMATION:
        //reduce the operational costs by some amount, implemented elsewhere
        break;
      case ResearchCardEffect.CORPORATE_ESPIONAGE:
        this.corporateEspionageEffect(company);
        break;
      case ResearchCardEffect.ECONOMIES_OF_SCALE:
        //When this company operates, it is considered to be the cheapest company regardless of it's unit price.
        this.economiesOfScaleEffect(company);
        break;
      case ResearchCardEffect.ROBOTICS:
      case ResearchCardEffect.ARTIFICIAL_INTELLIGENCE:
      case ResearchCardEffect.NEW_ALLOY:
      case ResearchCardEffect.CLINICAL_TRIAL:
      case ResearchCardEffect.RENEWABLE_ENERGY:
      case ResearchCardEffect.ENERGY_SAVING:
        this.genericSectorCompanyEffect(company);
        return;
      case ResearchCardEffect.NO_DISCERNIBLE_FINDINGS:
        return;
      default:
        return;
    }
  }
  //reduces all other companies in the sector prestige by 2, to a minimum of 0
  async corporateEspionageEffect(company: Company) {
    //get all companies in the sector except the acting company
    const companies = await this.companyService.companies({
      where: { sectorId: company.sectorId, id: { not: company.id } },
    });
    //update all companies in the sector
    companies.map(async (sectorCompany) => {
      await this.companyService.updateCompany({
        where: { id: sectorCompany.id },
        data: {
          prestigeTokens: Math.max(
            sectorCompany.prestigeTokens -
              CORPORATE_ESPIONAGE_PRESTIGE_REDUCTION,
            0,
          ),
        },
      });
    });
  }
  async economiesOfScaleEffect(company: Company) {
    await this.companyService.updateCompany({
      where: { id: company.id },
      data: { hasEconomiesOfScale: true },
    });
  }
  async genericSectorCompanyEffect(company: Company) {
    //get game
    const game = await this.gamesService.game({ id: company.gameId });
    if (!game) {
      throw new Error('Game not found');
    }
    //increase the stock price by the company by 1
    await this.stockHistoryService.moveStockPriceUp(
      company.gameId,
      company.id,
      game.currentPhaseId || '',
      company.currentStockPrice || 0,
      1,
      StockAction.RESEARCH_EFFECT,
    );
  }

  async companySupplyIncreaseEffect(company: Company) {
    //increase the company supply max by 1
    await this.companyService.updateCompany({
      where: { id: company.id },
      data: { supplyBase: company.supplyBase + 1 },
    });
  }

  async prestigeIncreaseEffect(company: Company) {
    //award the company 1 prestige token
    await this.companyService.updateCompany({
      where: { id: company.id },
      data: {
        prestigeTokens:
          company.prestigeTokens + PRESTIGE_EFFECT_INCREASE_AMOUNT,
      },
    });
  }

  async governmentGrantCardEffect(company: Company) {
    //Award the company $500
    await this.companyService.updateCompany({
      where: { id: company.id },
      data: { cashOnHand: company.cashOnHand + GOVERNMENT_GRANT_AMOUNT },
    });
  }

  async increasePrice(companyAction: CompanyAction) {
    //get the company
    const company = await this.companyService.company({
      id: companyAction.companyId,
    });
    if (!company) {
      throw new Error('Company not found');
    }
    //increase the company stock price
    await this.companyService.updateCompany({
      where: { id: company.id },
      data: {
        unitPrice: company.unitPrice + DEFAULT_INCREASE_UNIT_PRICE,
        demandScore: Math.max(company.demandScore - 1, 0),
      },
    });
  }

  async decreasePrice(companyAction: CompanyAction) {
    //get the company
    const company = await this.companyService.company({
      id: companyAction.companyId,
    });
    if (!company) {
      throw new Error('Company not found');
    }
    //decrease the company stock price
    await this.companyService.updateCompany({
      where: { id: company.id },
      data: {
        unitPrice: Math.max(company.unitPrice - DEFAULT_INCREASE_UNIT_PRICE, 0),
      },
    });
  }

  async spendPrestige(companyAction: CompanyAction) {
    //get the company
    const company = await this.companyService.company({
      id: companyAction.companyId,
    });
    if (!company) {
      throw new Error('Company not found');
    }
    //get game
    const game = await this.gamesService.game({ id: company.gameId });
    if (!game) {
      throw new Error('Game not found');
    }
    const prestigeTrack = createPrestigeTrackBasedOnSeed(game.id);
    const reward = prestigeTrack[game.nextPrestigeReward || 0];
    if (company.prestigeTokens >= reward.cost) {
      //if the company has enough prestige, spend it
      await this.companyService.updateCompany({
        where: { id: company.id },
        data: {
          prestigeTokens: Math.max(company.prestigeTokens - reward.cost, 0),
        },
      });
      //create the prestige reward
      const prestigeReward =
        await this.prestigeRewardService.createPrestigeReward({
          Company: { connect: { id: company.id } },
          Game: { connect: { id: company.gameId } },
          GameTurn: { connect: { id: game.currentTurn } },
          reward: reward.type,
        });
      //resolve Reward
      this.resolvePrestigeReward(prestigeReward, game.nextPrestigeReward || 0);
    } else {
      //skip the reward, if this reward is CAPITAL_INJECTION, double all CAPITAL_INJECTION REWARD totals
      this.gamesService.updateGame({
        where: {
          id: game.id,
        },
        data: {
          capitalInjectionRewards: game.capitalInjectionRewards.map(
            (capitalInjectionReward) =>
              Math.floor(capitalInjectionReward + CAPITAL_INJECTION_BOOSTER),
          ),
        },
      });
    }
    //move the track forward
    await this.gamesService.updateGameState({
      where: { id: company.gameId },
      data: {
        nextPrestigeReward: getNextPrestigeInt(game.nextPrestigeReward || 0),
      },
    });
  }

  async resolvePrestigeReward(
    prestigeReward: PrestigeRewards,
    nextPrestigeRewardIndex: number,
  ) {
    switch (prestigeReward.reward) {
      case PrestigeReward.BULL_SIGNAL:
        this.resolveBullSignal(prestigeReward);
        return;
      case PrestigeReward.CAPITAL_INJECTION:
        this.resolveCapitalInjection(prestigeReward, nextPrestigeRewardIndex);
        return;
      case PrestigeReward.ELASTICITY:
        this.resolveElasticity(prestigeReward);
        return;
      case PrestigeReward.INVESTOR_CONFIDENCE:
        this.resolveInvestorConfidence(prestigeReward);
        return;
      case PrestigeReward.MAGNET_EFFECT:
        this.resolveMagnetEffect(prestigeReward);
        return;
      case PrestigeReward.INFLUENCER:
        this.resolveInfluencer(prestigeReward);
        return;
      default:
        return;
    }
  }

  async resolveInfluencer(prestigeReward: PrestigeRewards) {
    //get company
    const company = await this.companyService.companyWithSector({
      id: prestigeReward.companyId,
    });
    if (!company) {
      throw new Error('Company not found');
    }
    //increase base demand
    await this.companyService.updateCompany({
      where: {
        id: company.id,
      },
      data: {
        baseDemand: company.baseDemand + 1,
      },
    });
  }
  async resolveMagnetEffect(prestigeReward: PrestigeRewards) {
    //get company
    const company = await this.companyService.companyWithSector({
      id: prestigeReward.companyId,
    });
    if (!company) {
      throw new Error('Company not found');
    }
    //get all companies in sector except this one
    const otherCompanies = await this.companyService.companies({
      where: { sectorId: company.sectorId },
    });
    if (!otherCompanies) {
      throw new Error('Other companies not found');
    }
    //increase otherCompanies stock price by 1
    const stockPromises = otherCompanies.map((otherCompany) => {
      return this.stockHistoryService.moveStockPriceUp(
        otherCompany.gameId,
        otherCompany.id,
        prestigeReward.gameTurnId || '',
        otherCompany.currentStockPrice || 0,
        1,
        StockAction.MAGNET_EFFECT,
      );
    });
    try {
      await Promise.all(stockPromises);
    } catch (error) {
      console.error('Error moving stock price up', error);
    }
  }

  async resolveCapitalInjection(
    prestigeReward: PrestigeRewards,
    nextPrestigeRewardIndex: number,
  ) {
    //get game
    const game = await this.gamesService.game({ id: prestigeReward.gameId });
    if (!game) {
      throw new Error('Game not found');
    }
    //The company receives $400
    const company = await this.companyService.company({
      id: prestigeReward.companyId,
    });
    if (!company) {
      throw new Error('Company not found');
    }
    const prestigeTrack = createPrestigeTrackBasedOnSeed(game.id);

    //get prestige reward value
    const capitalRewards = game.capitalInjectionRewards || [];

    //find what instance of CAPITAL_INJECTION this is in the prestige track
    const relativeIndex = prestigeTrack
      .slice(0, nextPrestigeRewardIndex)
      .filter((item) => item.type === PrestigeReward.CAPITAL_INJECTION).length;

    // Get the capital reward value at the relative index
    const capitalReward = capitalRewards[relativeIndex];

    //update the company cash on hand
    await this.companyService.updateCompany({
      where: { id: company.id },
      data: {
        cashOnHand:
          company.cashOnHand + (capitalReward || CAPITAL_INJECTION_STARTER),
      },
    });
    //update that index back to base capital injection
    this.gamesService.updateGame({
      where: { id: game.id },
      data: {
        capitalInjectionRewards: game.capitalInjectionRewards.map(
          (injectionReward, index) => {
            if (index === relativeIndex) {
              return CAPITAL_INJECTION_STARTER;
            } else {
              return injectionReward;
            }
          },
        ),
      },
    });
  }

  async resolveElasticity(prestigeReward: PrestigeRewards) {
    //the company sector receives +1 demand
    const company = await this.companyService.company({
      id: prestigeReward.companyId,
    });
    if (!company) {
      throw new Error('Company not found');
    }
    //get the sector
    const sector = await this.sectorService.sector({
      id: company.sectorId,
    });
    if (!sector) {
      throw new Error('Sector not found');
    }
    //update the sector demand
    await this.sectorService.updateSector({
      where: { id: sector.id },
      data: { demand: sector.demand + 1 },
    });
  }

  async resolveBullSignal(prestigeReward: PrestigeRewards) {
    //the company adjusts it's stock price up by 1
    const company = await this.companyService.company({
      id: prestigeReward.companyId,
    });
    if (!company) {
      throw new Error('Company not found');
    }
    //get game
    const game = await this.gamesService.game({
      id: prestigeReward.gameId,
    });
    if (!game) {
      throw new Error('Game not found');
    }
    //increase the company stock price
    await this.stockHistoryService.moveStockPriceUp(
      company.gameId,
      company.id,
      game.currentPhaseId || '',
      company.currentStockPrice || 0,
      1,
      StockAction.PRESTIGE_REWARD,
    );
  }

  async resolveInvestorConfidence(prestigeReward: PrestigeRewards) {
    //the company puts 3 more shares into the open market
    const company = await this.companyService.company({
      id: prestigeReward.companyId,
    });
    if (!company) {
      throw new Error('Company not found');
    }
    //create 3 shares
    const shares = [];
    for (let i = 0; i < 3; i++) {
      shares.push(
        await this.shareService.createShare({
          Company: { connect: { id: company.id } },
          location: ShareLocation.OPEN_MARKET,
          price: company.currentStockPrice,
          Game: { connect: { id: company.gameId } },
        }),
      );
    }
  }

  async expandCompany(companyAction: CompanyAction) {
    //increase the company tier and increase supply max by 1
    const company = await this.companyService.company({
      id: companyAction.companyId,
    });
    if (!company) {
      throw new Error('Company not found');
    }
    const newTier = getNextCompanyTier(company.companyTier);
    if (!newTier) {
      throw new Error('Company tier not found');
    }
    //update the company tier
    await this.companyService.updateCompany({
      where: { id: company.id },
      data: {
        companyTier: newTier,
        supplyMax: company.supplyMax + 1,
      },
    });
  }

  async downsizeCompany(companyAction: CompanyAction) {
    //decrease the company tier and decrease supply max by 1
    const company = await this.companyService.company({
      id: companyAction.companyId,
    });
    if (!company) {
      throw new Error('Company not found');
    }
    const newTier = getPreviousCompanyTier(company.companyTier);
    if (!newTier) {
      throw new Error('Company tier not found');
    }
    //update the company tier
    await this.companyService.updateCompany({
      where: { id: company.id },
      data: {
        companyTier: newTier,
        supplyMax: Math.min(company.supplyMax - 1, 0),
      },
    });
  }

  async resolveIssueShare(companyAction: CompanyAction) {
    //get the company
    const company = await this.companyService.company({
      id: companyAction.companyId,
    });
    if (!company) {
      throw new Error('Company not found');
    }
    //create new share for company
    return await this.shareService.createShare({
      Company: { connect: { id: companyAction.companyId } },
      location: ShareLocation.OPEN_MARKET,
      price: company.currentStockPrice,
      Game: { connect: { id: company.gameId } },
    });
  }

  async resolveShareBuyback(companyAction: CompanyAction): Promise<boolean> {
    //get the company
    const company = await this.companyService.company({
      id: companyAction.companyId,
    });
    if (!company) {
      throw new Error('Company not found');
    }
    //get the shares
    const shares = await this.shareService.shares({
      where: {
        companyId: company.id,
      },
    });
    //get one share from the open market and destroy it
    const share = shares.find((s) => s.location === ShareLocation.OPEN_MARKET);
    if (!share) {
      console.error('Share not found');
      return false;
    }
    //destroy the share
    await this.shareService.deleteShare({ id: share.id });
    //update the company cash on hand
    await this.companyService.updateCompany({
      where: { id: company.id },
      data: { cashOnHand: company.cashOnHand + (share.price || 0) },
    });
    return true;
  }

  async payForCompanyAction(companyAction: CompanyAction) {
    //get the company
    const company = await this.companyService.company({
      id: companyAction.companyId,
    });
    if (!company) {
      throw new Error('Company not found');
    }
    const game = await this.gamesService.game({ id: company.gameId });
    if (!game) {
      throw new Error('Game not found');
    }
    if (!companyAction.action) {
      throw new Error('Action not found');
    }
    //check if company action is of general type
    const companyActionType = companyActionsDescription.find(
      (description) => description.name == companyAction.action,
    )?.actionType;
    let cost;
    if (companyActionType === 'general') {
      //check how many times this action has been taken this round
      const companyActions = await this.companyActionService.companyActions({
        where: {
          id: { not: companyAction.id },
          companyId: company.id,
          action: companyAction.action,
          gameTurnId: game.currentTurn,
        },
      });
      cost = getCompanyActionCost(
        companyAction.action,
        company.currentStockPrice || 0,
        companyActions.length,
      );
    } else {
      //get the cost of the action
      cost = getCompanyActionCost(
        companyAction.action,
        company.currentStockPrice || 0,
      );
    }

    if (cost === undefined || cost === null) {
      throw new Error('Cost not found');
    }
    //check if the company has enough cash on hand
    if (company.cashOnHand < cost) {
      throw new Error('Company does not have enough cash on hand');
    }
    //check prestige cost
    const prestigeCost = CompanyActionPrestigeCosts[companyAction.action];
    if (prestigeCost && company.prestigeTokens < prestigeCost) {
      throw new Error('Company does not have enough prestige tokens');
    }
    //update the company cash on hand NOTE: this money does not go back to the bank.
    await this.companyService.updateCompany({
      where: { id: company.id },
      data: { cashOnHand: company.cashOnHand - cost },
    });

    //update the company action with the cost
    await this.companyActionService.updateCompanyAction({
      where: { id: companyAction.id },
      data: { cost },
    });

    // Determine transaction type based on action
    let transactionType: TransactionType = TransactionType.CASH;
    if (companyAction.action === OperatingRoundAction.RESEARCH) {
      transactionType = TransactionType.RESEARCH;
    }

    //create entity transaction
    this.transactionService
      .createTransactionEntityToEntity({
        fromEntityId: company.entityId || undefined,
        fromCompanyId: company.id,
        fromEntityType: EntityType.COMPANY,
        toEntityType: EntityType.BANK,
        amount: cost,
        transactionType: transactionType,
        gameId: game.id,
        gameTurnId: game.currentTurn,
        phaseId: game.currentPhaseId || '',
        description: `Company action ${companyAction.action}.`,
      })
      .catch((error) => {
        console.error('Error creating transaction', error);
      });
  }

  /**
   * The company receives a bonus demand score of 3.
   * This score decays by 1 every time the company operates.
   * The sector receives a bonus of 5 consumers at the end of the turn, this is handled
   * in the end turn phase.
   *
   * @param companyAction
   */
  async resolveMarketingAction(companyAction: CompanyActionWithCompany) {
    try {
      //give the company 3 demand
      await this.companyService.updateCompany({
        where: { id: companyAction.companyId },
        data: {
          demandScore:
            companyAction.Company.demandScore + LARGE_MARKETING_CAMPAIGN_DEMAND,
        },
      });
      //game log
      this.gameLogService.createGameLog({
        game: { connect: { id: companyAction.Company.gameId } },
        content: `Company ${companyAction.Company.name} has received a marketing campaign demand bonus of ${LARGE_MARKETING_CAMPAIGN_DEMAND}.`,
      });
      //get the sector
      const sector = await this.sectorService.sector({
        id: companyAction.Company.sectorId,
      });
      //if the sector is not found, throw error
      if (!sector) {
        throw new Error('Sector not found');
      }
      //get game
      const game = await this.gamesService.game({ id: sector.gameId || '' });
      //if the game is not found, throw error
      if (!game) {
        throw new Error('Game not found');
      }
      //add consumers to sector
      await this.sectorService.updateSector({
        where: { id: sector.id },
        data: {
          demandBonus: (sector.demandBonus || 0) + MARKETING_CONSUMER_BONUS,
        },
      });
    } catch (error) {
      console.error('Error updating company', error);
    }
  }

  async resolveIssueShares(companyAction: CompanyAction) {
    //get the company
    const company = await this.companyService.company({
      id: companyAction.companyId,
    });
    if (!company) {
      throw new Error('Company not found');
    }
    const sharesToIssue = ACTION_ISSUE_SHARE_AMOUNT;
    await this.shareService.createManyShares(
      Array.from({ length: sharesToIssue }).map(() => ({
        companyId: company.id,
        location: ShareLocation.OPEN_MARKET,
        price: company.currentStockPrice,
        gameId: company.gameId,
      })),
    );
  }

  /**
   * Adjust stock prices based on the results of the
   * company operation revenue vote.
   * @param phase
   * @returns
   */
  async adjustStockPrices(phase: Phase) {
    if (!phase.operatingRoundId) {
      throw new Error('Operating round not found');
    }
    const operatingRound =
      await this.operatingRoundService.operatingRoundWithProductionResults({
        id: phase.operatingRoundId,
      });

    if (!operatingRound) {
      console.error('Operating round not found');
      return;
    }

    const productionResults = operatingRound.productionResults;
    const stockPriceUpdates = [];
    const stockHistories = [];

    for (const result of productionResults) {
      const company = result.Company;
      let revenueDistribution = result.revenueDistribution;

      if (!revenueDistribution) {
        console.error(
          'Revenue distribution not found, setting to default RETAINED',
        );
        revenueDistribution = RevenueDistribution.RETAINED;
      }

      const revenue = result.revenue;
      if (revenue == 0) {
        console.error('No revenue to distribute');
        continue;
      }

      let newStockPrice;
      let steps;
      const companyHasBoomCyclePassiveEffect = company.CompanyActions.some(
        (action) => action.action === OperatingRoundAction.BOOM_CYCLE,
      );
      switch (revenueDistribution) {
        case RevenueDistribution.DIVIDEND_FULL:
          steps = getStepsWithMaxBeingTheNextTierMin(
            revenue,
            company.currentStockPrice || 0,
            companyHasBoomCyclePassiveEffect,
          );
          newStockPrice = getStockPriceStepsUp(
            company.currentStockPrice || 0,
            steps,
          );
          break;
        case RevenueDistribution.DIVIDEND_FIFTY_FIFTY:
          steps = getStepsWithMaxBeingTheNextTierMin(
            Math.floor(revenue / 2),
            company.currentStockPrice || 0,
            companyHasBoomCyclePassiveEffect,
          );
          newStockPrice = getStockPriceStepsUp(
            company.currentStockPrice || 0,
            steps,
          );
          break;
        case RevenueDistribution.RETAINED:
          newStockPrice = getStockPriceWithStepsDown(
            company.currentStockPrice || 0,
            1,
          );
          break;
        default:
          continue;
      }

      if (!newStockPrice) {
        console.error('New stock price not found');
        continue;
      }
      //game log
      this.gameLogService.createGameLog({
        game: { connect: { id: company.gameId } },
        content: `Company ${company.name} has adjusted stock price to $${newStockPrice} and moved ${steps || 0} steps.`,
      });

      stockPriceUpdates.push({
        where: { id: company.id },
        data: { currentStockPrice: newStockPrice },
      });

      stockHistories.push({
        companyId: company.id,
        price: newStockPrice,
        gameId: phase.gameId,
        phaseId: phase.id,
        stepsMoved: steps || 0,
        action: StockAction.PRODUCTION,
      });
    }

    // Update all stock prices in parallel
    await Promise.all(
      stockPriceUpdates.map(async (update) => {
        // Trigger limit order if applicable and await the result
        await this.playerOrderService.triggerLimitOrdersFilled(
          productionResults.find(
            (result) => result.Company.id === update.where.id,
          )?.Company.currentStockPrice || 0,
          update.data.currentStockPrice || 0,
          update.where.id,
        );

        // Update the company
        return this.companyService.updateCompany(update);
      }),
    );

    // Log stock history (or perform any other necessary actions)
    await this.stockHistoryService.createManyStockHistories(stockHistories);
  }

  /**
   * In this phase we must resolve votes for how revenue will be distributed
   * @param phase
   * @returns
   */
  async resolveOperatingProductionVotes(phase: Phase) {
    const game = await this.gamesService.game({ id: phase.gameId });
    if (!game) {
      console.error('Game not found');
      return;
    }
    if (!phase.operatingRoundId) {
      throw new Error('Operating round not found');
    }
    const operatingRound =
      await this.operatingRoundService.operatingRoundWithRevenueDistributionVotes(
        {
          id: phase.operatingRoundId,
        },
      );

    if (!operatingRound) {
      console.error('Operating round not found');
      return;
    }

    type GroupedByCompany = {
      [key: string]: RevenueDistributionVote[];
    };

    // Group votes by company
    const groupedVotes =
      operatingRound?.revenueDistributionVotes.reduce<GroupedByCompany>(
        (acc, vote) => {
          if (!acc[vote.companyId]) {
            acc[vote.companyId] = [vote];
          } else {
            acc[vote.companyId].push(vote);
          }
          return acc;
        },
        {},
      );

    if (!groupedVotes) {
      console.error('No grouped votes found');
      return;
    }

    const productionResultsUpdates: {
      where: Prisma.ProductionResultWhereInput;
      data: Prisma.ProductionResultUpdateManyMutationInput;
    }[] = [];

    // Iterate over companies
    for (const [companyId, votes] of Object.entries(groupedVotes)) {
      // Iterate over votes and calculate the total votes for each option
      const voteCount: { [key: string]: number } = {};
      //filter out votes that have weight of 0
      const validVotes = votes.filter((vote) => vote.weight > 0);
      validVotes.forEach((vote) => {
        if (!voteCount[vote.revenueDistribution]) {
          voteCount[vote.revenueDistribution] = 0;
        }
        voteCount[vote.revenueDistribution] += vote.weight;
      });

      // Get the option with the most votes
      const maxVotes = Math.max(...Object.values(voteCount));

      // Get the options that have the max vote count
      const maxVoteOptions = Object.keys(voteCount).filter(
        (key) => voteCount[key] === maxVotes,
      );

      // Get player priorities
      const playerPriorities =
        await this.playerPriorityService.listPlayerPriorities({
          where: { gameTurnId: game.currentTurn },
        });

      // Sort player priorities by priority (lower number means higher priority)
      playerPriorities.sort((a, b) => a.priority - b.priority);

      // Find the vote option with the highest player priority
      let maxVote: RevenueDistribution | null = null;
      for (const player of playerPriorities) {
        const playerVote = validVotes.find(
          (vote) =>
            vote.playerId === player.playerId &&
            maxVoteOptions.includes(vote.revenueDistribution),
        );
        if (playerVote) {
          maxVote = playerVote.revenueDistribution;
          break;
        }
      }

      if (maxVote) {
        // Only update ProductionResult if productionResultId exists (legacy operations)
        // Modern operations use FactoryProduction, so productionResultId will be null
        const productionResultId = validVotes[0].productionResultId;
        if (productionResultId !== null && productionResultId !== undefined) {
          productionResultsUpdates.push({
            where: {
              id: productionResultId,
              operatingRoundId: phase.operatingRoundId,
            },
            data: {
              revenueDistribution: maxVote as RevenueDistribution,
            },
          });
        }
        // For modern operations (productionResultId is null), the revenue distribution
        // is handled directly in the dividend calculation, not via ProductionResult
      }
    }

    // Perform bulk update
    await Promise.all(
      productionResultsUpdates.map((update) =>
        this.productionResultService.updateManyProductionResults(update),
      ),
    );
    try {
      // Check if this is modern operations
      const game = await this.gamesService.game({ id: phase.gameId });
      if (game?.operationMechanicsVersion === OperationMechanicsVersion.MODERN) {
        await this.calculateAndDistributeDividendsModern(phase);
      } else {
        await this.calculateAndDistributeDividends(phase);
      }
    } catch (error) {
      console.error('Error calculating and distributing dividends', error);
    }
  }

  async retry<T>(fn: () => Promise<T>, retries: number = 3): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) {
          throw error;
        }
      }
    }
    throw new Error('Exceeded maximum retries');
  }

  async processBatch(batch: Array<() => Promise<any>>): Promise<void> {
    await Promise.all(batch.map((fn) => this.retry(fn)));
  }

  /**
   * Calculates the throughput of a company by finding the difference between the demand score, sector demand, and supply.
   * @param company - The company object containing demand score, sector demand, and supply details.
   * @returns The calculated throughput value.
   */
  calculateThroughputByTheoreticalDemand(company: {
    demandScore: number;
    baseDemand: number;
    Sector: {
      demand: number;
      demandBonus?: number;
    };
    supplyBase: number;
    supplyMax: number;
    supplyCurrent: number;
  }): number {
    const totalSectorDemand =
      company.Sector.demand + (company.Sector.demandBonus || 0);
    const companySupply = calculateCompanySupply(
      company.supplyBase,
      company.supplyMax,
      company.supplyCurrent,
    );
    const throughput =
      calculateDemand(company.demandScore, company.baseDemand) - companySupply;
    return throughput;
  }

  calculateThroughputByUnitsSold(
    unitsManufactured: number,
    unitsSold: number,
  ): number {
    return Math.abs(unitsManufactured - unitsSold);
  }

  async getPreviousTurn(game: Game): Promise<GameTurnWithRelations> {
    const currentTurn = await this.gameTurnService.getCurrentTurn(game.id);
    if (!currentTurn) {
      throw new Error('Current turn not found');
    }
    //get previous turn
    const previousTurn = await this.gameTurnService.gameTurns({
      where: { turn: currentTurn.turn - 1, game: { id: game.id } },
    });
    if (!previousTurn) {
      throw new Error('Previous turn not found');
    }
    return previousTurn[0];
  }

  /**
   * Determine supply and demand difference, award bonuses and penalties.
   * Determine company operations revenue.
   * Calculate the "throughput" by finding the diff between the supply and demand.
   * If a company has a throughput of 0, it is considered to have met optimal efficiency
   * and gets a prestige token and also benefits the entire sector.
   * @param phase
   * @returns
   */
  async resolveOperatingProduction(phase: Phase) {
    const game = await this.gamesService.game({ id: phase.gameId });
    if (!game) {
      throw new Error('Game not found');
    }
    if (!phase.operatingRoundId) {
      throw new Error('Operating round not found');
    }

    let companies = await this.companyService.companiesWithRelations({
      where: { gameId: phase.gameId, status: CompanyStatus.ACTIVE },
    });
    if (!companies) {
      throw new Error('Companies not found');
    }

    const previousTurn = await this.getPreviousTurn(game);

    const companyCashOnHandUpdates = [];
    const gameLogs = [];
    const transactionDataCollection = [];

    // Filter out insolvent companies
    companies = companies.filter(
      (company) => company.status === CompanyStatus.ACTIVE,
    );

    // Group companies by sector
    const groupedCompanies = companies.reduce<{
      [key: string]: CompanyWithRelations[];
    }>((acc, company) => {
      if (!acc[company.sectorId]) {
        acc[company.sectorId] = [];
      }
      acc[company.sectorId].push(company);
      return acc;
    }, {});

    const sectorRewards: { [sectorId: string]: number } = {};
    const companyUpdates = [];
    const companyActionUpdates = [];
    const productionResults = [];
    const stockPenalties = [];
    const sectorConsumersUpdates = [];

    let globalConsumers = game.consumerPoolNumber;

    const companyPretigeRewardOperationDiscounts: {
      [companyId: string]: boolean;
    } = {};

    // OPTIMIZATION: Fetch all sectors in parallel before processing
    const sectorIds = Object.keys(groupedCompanies);
    const sectors = await Promise.all(
      sectorIds.map(id => this.sectorService.sector({ id }))
    );
    const sectorMap = new Map(
      sectors.filter(s => s !== null).map(s => [s!.id, s!])
    );

    for (const [sectorId, sectorCompanies] of Object.entries(
      groupedCompanies,
    )) {
      const sector = sectorMap.get(sectorId);
      if (!sector) {
        console.error('Sector not found');
        continue;
      }

      let consumers = sector.consumers;
      const sectorCompaniesSorted =
        companyPriorityOrderOperations(sectorCompanies);
      //match the sectorCompanies to the same order as sectorCompaniesSorted
      // Create a map for easy lookup of the sorted order
      const sectorCompanyOrderMap = new Map(
        sectorCompaniesSorted.map((company, index) => [company.id, index]),
      );

      // Sort sectorCompanies based on the order in sectorCompanyOrderMap
      const reorderedSectorCompanies = sectorCompanies.sort((a, b) => {
        const indexA = sectorCompanyOrderMap.get(a.id) || 0;
        const indexB = sectorCompanyOrderMap.get(b.id) || 0;
        return indexA - indexB;
      });

      for (const company of reorderedSectorCompanies) {
        companyPretigeRewardOperationDiscounts[company.id] = false;
        let unitsManufactured = calculateCompanySupply(
          company.supplyBase,
          company.supplyMax,
          company.supplyCurrent,
        );
        let consumersCountForCompany = consumers;
        //does company have the STEADY_DEMAND passive effect
        const hasSteadyDemand = company.CompanyActions.some(
          (action) => action.action === OperatingRoundAction.STEADY_DEMAND,
        );

        const demandScore = calculateDemand(
          company.demandScore,
          company.baseDemand,
        );

        let unitsSold = Math.min(unitsManufactured, demandScore);
        if (unitsSold > consumersCountForCompany) {
          unitsSold = consumersCountForCompany;
        }
        let revenue = company.unitPrice * unitsSold;
        //check if company has the STRATEGIC_RESERVE unresolved
        const hasStrategicReserve = company.CompanyActions.some(
          (action) =>
            action.action === OperatingRoundAction.STRATEGIC_RESERVE &&
            action.actedOn == false,
        );
        if (hasStrategicReserve) {
          revenue += Math.floor(
            revenue * (STRATEGIC_RESERVE_REVENUE_MULTIPLIER_PERCENTAGE / 100),
          );
        }
        const hasSurgePricing = company.CompanyActions.some(
          (action) =>
            action.action === OperatingRoundAction.SURGE_PRICING &&
            action.actedOn == false,
        );
        const companyActionId = company.CompanyActions.find(
          (action) =>
            action.action === OperatingRoundAction.SURGE_PRICING &&
            action.actedOn == false,
        )?.id;
        if (hasSurgePricing && companyActionId) {
          revenue += Math.floor(
            revenue * (SURGE_PRICING_REVENUE_MULTIPLIER_PERCENTAGE / 100),
          );
          companyActionUpdates.push({
            id: companyActionId,
            actedOn: true,
          });
        }
        consumers -= unitsSold;
        globalConsumers += unitsSold;
        const consumersMoved = unitsSold;
        //after we have made calculations to adjust the consumer count, we can
        //apply the steady demand bonus to units sold for revenue.  STEADY_DEMAND should only impact the revenue collected should it be valid to be applied.
        // Apply the steady demand bonus if no consumers are available
        if (hasSteadyDemand && consumers <= 0 && demandScore > unitsSold) {
          const bonusUnits = Math.min(
            STEADY_DEMAND_CONSUMER_BONUS,
            unitsManufactured - unitsSold,
          );
          unitsSold += bonusUnits;
          revenue += company.unitPrice * bonusUnits;
        }
        sectorConsumersUpdates.push({
          id: sectorId,
          consumers,
        });

        let throughput = this.calculateThroughputByUnitsSold(
          unitsManufactured,
          demandScore,
        );
        //if company has the CARBON_CREDIT throughtput passive effect, ensure the throughput is at maximum 1.
        const hasCarbonCredit = company.CompanyActions.some(
          (action) => action.action === OperatingRoundAction.CARBON_CREDIT,
        );
        if (hasCarbonCredit) {
          throughput = Math.min(throughput, 1);
        }
        const throughputOutcome = throughputRewardOrPenalty(throughput);

        const companyUpdate = {
          id: company.id,
          prestigeTokens: company.prestigeTokens || 0,
        };

        if (unitsSold >= unitsManufactured) {
          companyUpdate.prestigeTokens = (company.prestigeTokens || 0) + 1;
        }

        if (throughputOutcome.type === ThroughputRewardType.SECTOR_REWARD) {
          // stockRewards.push({
          //   gameId: phase.gameId,
          //   companyId: company.id,
          //   phaseId: String(phase.id),
          //   currentStockPrice: company.currentStockPrice || 0,
          //   steps: 1,
          // });
          companyPretigeRewardOperationDiscounts[company.id] = true;
          gameLogs.push({
            gameId: phase.gameId,
            content: `Company ${company.name} has met optimal efficiency and it's operating costs have been reduced by %${PRETIGE_REWARD_OPERATION_COST_PERCENTAGE_REDUCTION} this turn.`,
          });
        } else if (
          throughputOutcome.type === ThroughputRewardType.STOCK_PENALTY
        ) {
          stockPenalties.push({
            gameId: phase.gameId,
            companyId: company.id,
            phaseId: String(phase.id),
            currentStockPrice: company.currentStockPrice || 0,
            steps: throughputOutcome.share_price_steps_down || 0,
          });
          gameLogs.push({
            gameId: phase.gameId,
            content: `Company ${company.name} has not met optimal efficiency and has been penalized ${throughputOutcome.share_price_steps_down} share price steps down.`,
          });
        }
        const productionResultToPush = {
          revenue,
          consumers: consumersMoved,
          companyId: company.id,
          operatingRoundId: phase.operatingRoundId,
          throughputResult: throughput,
          steps: throughputOutcome.share_price_steps_down || 0,
        };
        productionResults.push(productionResultToPush);

        companyUpdates.push(companyUpdate);
      }
    }

    // Process all company operational costs
    for (const company of companies) {
      const hasAutomationCard = company.Cards.some(
        (card) => card.effect === ResearchCardEffect.AUTOMATION,
      );
      let operatingCosts = CompanyTierData[company.companyTier].operatingCosts;

      if (previousTurn) {
        const vetoed = previousTurn.companyActions.some(
          (action) =>
            action.companyId === company.id &&
            action.action === OperatingRoundAction.VETO,
        );
        if (vetoed) {
          operatingCosts = Math.floor(operatingCosts / 2);
        }
      }
      if (companyPretigeRewardOperationDiscounts[company.id]) {
        operatingCosts = Math.floor(
          operatingCosts *
            (PRETIGE_REWARD_OPERATION_COST_PERCENTAGE_REDUCTION / 100),
        );
      }
      if (hasAutomationCard) {
        operatingCosts =
          operatingCosts - AUTOMATION_EFFECT_OPERATIONS_REDUCTION;
      }
      const hasStrategicReserveCard = company.CompanyActions.some(
        (action) =>
          action.action === OperatingRoundAction.STRATEGIC_RESERVE &&
          action.actedOn === false,
      );
      const companyActionId = company.CompanyActions.find(
        (action) =>
          action.action === OperatingRoundAction.STRATEGIC_RESERVE &&
          action.actedOn === false,
      )?.id;

      if (hasStrategicReserveCard && companyActionId) {
        operatingCosts = 0;
        companyActionUpdates.push({
          id: companyActionId,
          actedOn: true,
        });
      } else {
        operatingCosts = Math.max(operatingCosts, 0);
      }
      if (company.cashOnHand < operatingCosts) {
        companyCashOnHandUpdates.push({
          id: company.id,
          cashOnHand: 0,
          status: CompanyStatus.INSOLVENT,
        });
        gameLogs.push({
          gameId: phase.gameId,
          content: `Company ${company.name} has gone insolvent.`,
        });
      } else {
        companyCashOnHandUpdates.push({
          id: company.id,
          cashOnHand: company.cashOnHand - operatingCosts,
          status: CompanyStatus.ACTIVE,
        });
        gameLogs.push({
          gameId: phase.gameId,
          content: `Company ${company.name} has paid operating costs of $${
            CompanyTierData[company.companyTier].operatingCosts
          }.`,
        });
        const transactionData =
          await this.transactionService.collectTransactionData({
            fromEntityType: EntityType.COMPANY,
            fromCompanyId: company.id,
            toEntityType: EntityType.BANK,
            transactionSubType: TransactionSubType.OPERATING_COST,
            amount: operatingCosts,
            phaseId: phase.id,
            gameId: phase.gameId,
            gameTurnId: game.currentTurn,
            transactionType: TransactionType.CASH,
            description: `Operating costs.`,
          });
        transactionDataCollection.push(transactionData);
      }
    }

    this.transactionService
      .createManyTransactionsFromCollectedData(transactionDataCollection)
      .catch((error) => {
        console.error('Error creating transactions', error);
      });

    // Batch update companies' cashOnHand and statuses
    await this.companyService.updateManyCompanies(companyCashOnHandUpdates);

    await this.companyActionService.updateManyCompanyActions(
      companyActionUpdates,
    );
    // Batch update companies, production results, stock changes, and sectors
    await this.companyService.updateManyCompanies(companyUpdates);
    await this.productionResultService.createManyProductionResults(
      productionResults,
    );
    await this.processStockChanges(stockPenalties, []);
    await this.sectorService.updateMany(sectorConsumersUpdates);
    await this.gamesService.updateGame({
      where: { id: phase.gameId },
      data: { consumerPoolNumber: globalConsumers },
    });

    // Log all game events
    this.gameLogService.createManyGameLogs(gameLogs).catch((error) => {
      console.error('Error creating game logs', error);
    });
  }

  async processStockChanges(
    stockPenalties: {
      gameId: string;
      companyId: string;
      phaseId: string;
      currentStockPrice: number;
      steps: number;
    }[],
    stockRewards: {
      gameId: string;
      companyId: string;
      phaseId: string;
      currentStockPrice: number;
      steps: number;
    }[],
  ) {
    // OPTIMIZATION: Process all stock penalties in parallel
    const penaltyPromises = stockPenalties.map(async (penalty) => {
      const newHistory = await this.stockHistoryService.moveStockPriceDown(
        penalty.gameId,
        penalty.companyId,
        penalty.phaseId,
        penalty.currentStockPrice,
        penalty.steps,
        StockAction.PRODUCTION,
      );
      // Trigger any additional actions such as fulfilling orders
      await this.playerOrderService.triggerLimitOrdersFilled(
        penalty.currentStockPrice,
        newHistory.price,
        penalty.companyId,
      );
    });

    // OPTIMIZATION: Process all stock rewards in parallel
    const rewardPromises = stockRewards.map(async (reward) => {
      const newHistory = await this.stockHistoryService.moveStockPriceUp(
        reward.gameId,
        reward.companyId,
        reward.phaseId,
        reward.currentStockPrice,
        reward.steps,
        StockAction.PRODUCTION,
      );
      // Trigger any additional actions such as fulfilling orders
      await this.playerOrderService.triggerLimitOrdersFilled(
        reward.currentStockPrice,
        newHistory.price,
        reward.companyId,
      );
    });

    // Wait for all operations to complete
    await Promise.all([...penaltyPromises, ...rewardPromises]);
  }

  async createManyProductionResults(
    results: Prisma.ProductionResultCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.productionResult.createMany({
      data: results,
      skipDuplicates: true,
    });
  }

  async resolveInsolvencyContribution(
    gameId: string,
    contribution: InsolvencyContribution,
  ) {
    //get game
    const game = await this.gamesService.game({ id: gameId });
    if (!game) {
      throw new Error('Game not found');
    }
    const company = await this.companyService.company({
      id: contribution.companyId,
    });
    const player = await this.playersService.player({
      id: contribution.playerId,
    });
    if (!player) {
      throw new Error('Player not found resolveInsolvencyContribution');
    }
    if (!company) {
      throw new Error('Company not found');
    }
    if (contribution.cashContribution > 0) {
      await this.playerRemoveMoney(
        game.id,
        game.currentTurn,
        game.currentPhaseId || '',
        contribution.playerId,
        contribution.cashContribution,
        EntityType.COMPANY,
        'Insolvency cash contribution',
        company.entityId || undefined,
      );
    }
    if (contribution.shareContribution > 0) {
      await this.playerRemoveMoney(
        game.id,
        game.currentTurn,
        game.currentPhaseId || '',
        contribution.playerId,
        contribution.shareContribution * (company.currentStockPrice || 0),
        EntityType.BANK,
        'Insolvency share contribution',
      );
      await this.playerRemoveShares({
        gameId: game.id,
        gameTurnId: game.currentTurn,
        phaseId: game.currentPhaseId || '',
        playerId: contribution.playerId,
        companyId: contribution.companyId,
        amount: contribution.shareContribution,
        toLocation: ShareLocation.OPEN_MARKET,
        fromLocation: ShareLocation.PLAYER,
        description: 'Insolvency share contribution',
        fromEntityType: EntityType.PLAYER,
        fromEntityId: player.entityId || undefined,
        toEntityType: EntityType.BANK,
      });
    }

    // Calculate total contribution value
    const totalContributionValue = contribution.cashContribution + 
      (contribution.shareContribution * (company.currentStockPrice || 0));

    // Update company cash with the contribution
    const updatedCompany = await this.companyService.updateCompany({
      where: { id: company.id },
      data: {
        cashOnHand: company.cashOnHand + totalContributionValue,
      },
    });

    // If company cash is now positive, set status to ACTIVE immediately
    if (updatedCompany.cashOnHand >= 0 && company.status === CompanyStatus.INSOLVENT) {
      await this.companyService.updateCompany({
        where: { id: company.id },
        data: { status: CompanyStatus.ACTIVE },
      });
      await this.gameLogService.createGameLog({
        game: { connect: { id: game.id } },
        content: `${company.name} has recovered from insolvency with cash of $${updatedCompany.cashOnHand}.`,
      });
    }
  }
  /**
   * Resolve the company votes, if there is a tie, we take priority in the vote priority order.
   * If the company is insolvent, we instead resolve cash contributions.
   *
   * @param phase
   */
  async resolveCompanyVotes(phase: Phase) {
    //get the game
    const game = await this.gamesService.game({ id: phase.gameId });
    if (!game) {
      throw new Error('Game not found');
    }
    // Get the company from the phase
    const company = await this.companyService.company({
      id: phase.companyId || '',
    });
    if (!company) {
      throw new Error('Company not found');
    }

    if (company.status == CompanyStatus.INSOLVENT) {
      // Collect all insolvency contributions for the current turn
      const insolvencyContributions =
        await this.insolvencyContributionService.listInsolvencyContributions({
          where: { gameTurnId: phase.gameTurnId, companyId: company.id },
        });

      // Filter contributions once and reuse the results
      const cashContributions = insolvencyContributions.filter(
        (contribution) => contribution.cashContribution > 0,
      );
      const shareContributions = insolvencyContributions.filter(
        (contribution) => contribution.shareContribution > 0,
      );

      // Calculate total contributions without additional database calls
      const totalCashContributed = cashContributions.reduce(
        (acc, contribution) => acc + contribution.cashContribution,
        0,
      );
      const totalShareValueContributed = shareContributions.reduce(
        (acc, contribution) =>
          acc +
          contribution.shareContribution * (company.currentStockPrice || 0),
        0,
      );

      const companyTier = CompanyTierData[company.companyTier];
      if (!companyTier) {
        throw new Error('Company tier not found');
      }
      const shortFall = companyTier.insolvencyShortFall;

      if (
        company.cashOnHand +
          totalCashContributed +
          totalShareValueContributed >=
        shortFall
      ) {
        await this.companyService.updateCompany({
          where: { id: company.id },
          data: { status: CompanyStatus.ACTIVE },
        });
        this.gameLogService.createGameLog({
          game: { connect: { id: phase.gameId } },
          content: `Company ${company.name} has recovered from insolvency.`,
        });
      } else {
        this.gameLogService.createGameLog({
          game: { connect: { id: phase.gameId } },
          content: `Company ${company.name} has not recovered from insolvency and will now bankrupt.`,
        });

        // Bankrupt the company and handle liquidation
        const updatedCompany = await this.companyService.updateCompany({
          where: { id: company.id },
          data: { status: CompanyStatus.BANKRUPT },
        });

        const shares = await this.shareService.shares({
          where: { companyId: updatedCompany.id },
        });

        if (shares.length > 0) {
          const shareLiquidationPromises = shares.map(async (share) => {
            const shareLiquidationValue = Math.floor(
              (updatedCompany.currentStockPrice || 0) *
                (BANKRUPTCY_SHARE_PERCENTAGE_RETAINED / 100),
            );
            this.shareService.deleteShare({ id: share.id });
            if (share.playerId) {
              return this.playerAddMoney({
                gameId: phase.gameId,
                gameTurnId: phase.gameTurnId,
                phaseId: phase.id,
                playerId: share.playerId,
                amount: shareLiquidationValue,
                fromEntity: EntityType.BANK,
                description: 'Company liquidation',
                transactionSubType: TransactionSubType.SHARE_LIQUIDATION,
              });
            }
          });

          await Promise.all(shareLiquidationPromises);
        }
      }

      // Update company cash and create game log
      await this.companyService.updateCompany({
        where: { id: company.id },
        data: {
          cashOnHand:
            company.cashOnHand +
            totalCashContributed +
            totalShareValueContributed,
        },
      });

      this.gameLogService.createGameLog({
        game: { connect: { id: phase.gameId } },
        content: `Company ${company.name} has received a total of $${
          totalCashContributed + totalShareValueContributed
        } from insolvency contributions.`,
      });

      // Adjust stock price in one operation
      const totalSharesContributed = shareContributions.reduce(
        (acc, contribution) => acc + contribution.shareContribution,
        0,
      );

      await this.stockHistoryService.moveStockPriceDown(
        company.gameId,
        company.id,
        phase.id,
        company.currentStockPrice || 0,
        totalSharesContributed,
        StockAction.MARKET_SELL,
      );
    } else {
      if (company.status !== CompanyStatus.ACTIVE) {
        throw new Error('Company is not active');
      }

      const companyTier = CompanyTierData[company.companyTier];
      if (!companyTier) {
        throw new Error('Company tier not found');
      }
      const companyActionCount: number = companyTier.companyActions;
      if (!phase.operatingRoundId) {
        throw new Error('Operating round not found');
      }
      // Collect votes in one query
      const votes = await this.prisma.operatingRoundVote.findMany({
        where: {
          companyId: company.id,
          operatingRoundId: phase.operatingRoundId,
          weight: { gt: 0 },
        },
        include: {
          Player: {
            include: {
              Share: true,
            },
          },
        },
      });

      // Calculate vote weights
      const actionVotes: { [key in OperatingRoundAction]?: number } = {};
      for (const vote of votes) {
        actionVotes[vote.actionVoted] =
          (actionVotes[vote.actionVoted] || 0) + vote.weight;
      }

      //get player priority for current turn
      const playerPriorities =
        await this.playerPriorityService.listPlayerPriorities({
          where: { gameTurnId: game.currentTurn },
        });

      const getLowestPlayerPriorityForAction = (
        action: OperatingRoundAction,
      ) => {
        const relevantVotes = votes.filter(
          (vote) => vote.actionVoted === action,
        );
        const priorities = relevantVotes.map(
          (vote) =>
            playerPriorities.find((p) => p.playerId === vote.playerId)
              ?.priority || Infinity,
        );
        return Math.min(...priorities);
      };

      // Sort actions based on votes and resolve ties using player priorities
      let sortedActions = Object.entries(actionVotes)
        .sort(([aAction, aVotes], [bAction, bVotes]) => {
          const voteDifference = (bVotes || 0) - (aVotes || 0);

          if (voteDifference === 0) {
            // Resolve tie by checking the lowest player priority for each action
            const aLowestPriority = getLowestPlayerPriorityForAction(
              aAction as OperatingRoundAction,
            );
            const bLowestPriority = getLowestPlayerPriorityForAction(
              bAction as OperatingRoundAction,
            );

            return aLowestPriority - bLowestPriority;
          }

          return voteDifference;
        })
        .slice(0, companyActionCount)
        .map(([action]) => action as OperatingRoundAction);

      // If there are no actions, add a veto action
      if (sortedActions.length === 0) {
        sortedActions.push(OperatingRoundAction.VETO);
      }

      if (!phase.operatingRoundId) {
        throw new Error('Operating round not found');
      }

      // Handle company actions in a batch manner
      const existingActions = await this.companyActionService.companyActions({
        where: {
          companyId: company.id,
          operatingRoundId: phase.operatingRoundId,
        },
      });

      const existingActionMap = new Map(
        existingActions.map((action) => [action.action, action]),
      );

      for (const resolvedAction of sortedActions) {
        const existingAction = existingActionMap.get(resolvedAction);
        if (!existingAction) {
          if (!phase.operatingRoundId) {
            throw new Error('Operating round not found');
          }
          await this.companyActionService.createCompanyAction({
            action: resolvedAction,
            GameTurn: { connect: { id: phase.gameTurnId } },
            Company: { connect: { id: company.id } },
            OperatingRound: { connect: { id: phase.operatingRoundId } },
          });
        } else {
          await this.companyActionService.updateCompanyAction({
            where: { id: existingAction.id },
            data: { action: resolvedAction },
          });
        }
      }
    }
  }

  /**
   * Increment the turn number and "spool" out the customer pool to the sectors.
   * @param phase
   */
  async resolveEndTurn(phase: Phase) {
    // Get sectors and game
    const [sectors, game] = await Promise.all([
      this.sectorService.sectorsWithCompanies({
        where: { gameId: phase.gameId },
      }),
      this.gamesService.getGameState(phase.gameId),
    ]);

    const sectorPriorityStored = game?.sectorPriority;
    let sectorsSorted: SectorWithCompanyRelations[] = [];
    if (sectorPriorityStored) {
      sectorsSorted = sortSectorIdsByPriority(
        sectors.map((sector) => sector.id),
        sectorPriorityStored,
      )
        .map((sectorId) => sectors.find((s) => s.id === sectorId))
        .filter(
          (sector) => sector !== undefined,
        ) as SectorWithCompanyRelations[];
    } else {
      sectorsSorted = sectors.sort((a, b) => {
        return (
          sectorPriority.indexOf(a.sectorName) -
          sectorPriority.indexOf(b.sectorName)
        );
      });
    }

    if (!game) {
      throw new Error('Game not found');
    }

    let marketingOrdersGroupedBySectorId: {
      sectorId: string;
      count: number;
    }[] = [];

    try {
      if (!game.currentOperatingRoundId) {
        throw new Error('Current operating round not found');
      }
      // Get all action orders of type marketing from the round and group by sector
      marketingOrdersGroupedBySectorId =
        await this.companyActionService.marketingOrdersGroupedBySectorId(
          game.currentOperatingRoundId,
        );
    } catch (error) {
      console.error('Error getting marketing orders', error);
    }

    // Initialize variables
    const sectorUpdates: {
      where: { id: string };
      data: { consumers: number };
    }[] = [];
    const economyScore = game.economyScore;
    let consumersMovedCounter = 0;

    // Distribute remaining economy score to sectors
    let sectorIndex = 0;
    let remainingEconomyScore = economyScore;

    while (remainingEconomyScore > 0) {
      const sector = sectors[sectorIndex];
      let update = sectorUpdates.find(
        (update) => update.where.id === sector.id,
      );
      if (!update) {
        //create new update
        sectorUpdates.push({
          where: { id: sector.id },
          data: { consumers: sector.consumers },
        });

        update = sectorUpdates.find((update) => update.where.id === sector.id);
      }

      if (update) {
        const allocation = Math.min(
          sector.demand + (sector.demandBonus || 0),
          remainingEconomyScore,
        );
        const consumersToAdd = Math.min(game.consumerPoolNumber, allocation);
        if (consumersToAdd > 0) {
          update.data.consumers += consumersToAdd;
          game.consumerPoolNumber -= consumersToAdd;
          remainingEconomyScore -= consumersToAdd;
          consumersMovedCounter += consumersToAdd;
          //game log
          this.gameLogService.createGameLog({
            game: { connect: { id: phase.gameId } },
            content: `Sector ${sector.sectorName} has received ${consumersToAdd} consumers.`,
          });
        }
      }

      sectorIndex = (sectorIndex + 1) % sectors.length;
    }

    try {
      // Update sectors in database
      await Promise.all(
        sectorUpdates.map((update) =>
          this.prisma.sector.update({
            where: update.where,
            data: update.data,
          }),
        ),
      );

      //get current turn
      const currentTurn = await this.gameTurnService.getCurrentTurn(
        phase.gameId,
      );

      if (!currentTurn) {
        throw new Error('Current turn not found');
      }
      //create a new game turn
      const newTurn = await this.gameTurnService.createGameTurn({
        game: { connect: { id: phase.gameId } },
        turn: currentTurn?.turn + 1,
      });

      // Update game state for new consumerPoolNumber and turn
      await this.gamesService.updateGameState({
        where: { id: phase.gameId },
        data: {
          currentTurn: newTurn.id,
          consumerPoolNumber: game.consumerPoolNumber,
          currentOperatingRoundId: null,
          currentStockRoundId: null,
        },
      });
    } catch (error) {
      console.error('Error updating sectors', error);
      throw new Error('Failed to update sectors');
    }
  }

  async addPlayersToGame(
    gameId: string,
    roomId: number,
    startingCashOnHand: number,
    bots: number,
  ): Promise<Player[]> {
    // 1) Get real users from the room
    const users = await this.prisma.roomUser.findMany({
      where: { roomId },
      include: {
        user: true,
      },
    });

    // 2) Build the array of player data for humans
    const playersToCreate: Prisma.PlayerCreateManyInput[] = users.map(
      (roomUser) => ({
        nickname: roomUser.user.name,
        cashOnHand: startingCashOnHand,
        gameId,
        userId: roomUser.userId,
        marketOrderActions: MAX_MARKET_ORDER_ACTIONS,
        limitOrderActions: MAX_LIMIT_ORDER_ACTIONS,
        shortOrderActions: MAX_SHORT_ORDER_ACTIONS,
        marginAccount: 0,
        isBot: false, // real humans
      }),
    );

    // 3) Add the requested number of bots
    //    Each bot uses userId = 'BOT' (or you can do 'BOT-<unique>')
    //    and sets isBot = true.
    for (let i = 0; i < bots; i++) {
      const shortName = uniqueNamesGenerator({
        dictionaries: [adjectives, animals, colors], // colors can be omitted here as not used
        length: 2,
      });
      playersToCreate.push({
        nickname: shortName,
        cashOnHand: startingCashOnHand,
        gameId,
        marketOrderActions: MAX_MARKET_ORDER_ACTIONS,
        limitOrderActions: MAX_LIMIT_ORDER_ACTIONS,
        shortOrderActions: MAX_SHORT_ORDER_ACTIONS,
        marginAccount: 0,
        userId: null,
        isBot: true,
      });
    }

    // 4) Create players in bulk
    return this.playersService.createManyPlayers(playersToCreate);
  }

  async startGame(input: StartGameInput): Promise<Game> {
    const {
      roomId,
      roomName,
      startingCashOnHand,
      consumerPoolNumber,
      bankPoolNumber,
      distributionStrategy,
      gameMaxTurns,
      playerOrdersConcealed,
      useOptionOrders,
      useLimitOrders,
      useShortOrders,
      isTimerless,
      bots,
      operationMechanicsVersion,
    } = input;

    console.log('operationMechanicsVersion', operationMechanicsVersion);

    const gameData: Prisma.GameCreateInput = {
      name: roomName,
      currentTurn: '',
      currentOrSubRound: 0,
      currentRound: 'INFLUENCE',
      bankPoolNumber,
      consumerPoolNumber,
      distributionStrategy,
      playerOrdersConcealed,
      gameStatus: GameStatus.ACTIVE,
      gameStep: 0,
      currentPhaseId: 'initial',
      gameMaxTurns,
      economyScore: STABLE_ECONOMY_SCORE,
      Room: { connect: { id: roomId } },
      useOptionOrders,
      useLimitOrders,
      useShortOrders,
      isTimerless,
      operationMechanicsVersion,
      workers: DEFAULT_WORKERS,
      workforcePool: DEFAULT_WORKERS, // Initialize available workers to default (40)
    };

    const jsonData = gameDataJson;
    if (!jsonData || !jsonData.sectors || !Array.isArray(jsonData.sectors)) {
      throw new Error('Invalid JSON data for sectors');
    }

    try {
      // Create the game
      const game = await this.gamesService.createGame(gameData);

      //Create the first turn
      const newTurn = await this.gameTurnService.createGameTurn({
        game: { connect: { id: game.id } },
        turn: 1,
      });
      //update the game currentTurn
      await this.gamesService.updateGameState({
        where: { id: game.id },
        data: { currentTurn: newTurn.id, nextPrestigeReward: 0 },
      });

      //create research deck
      await this.createResearchDeck(game.id);

      // Initialize forecast quarters
      await this.forecastService.initializeForecastQuarters(game.id);

      // Add players to the game
      const players = await this.addPlayersToGame(
        game.id,
        roomId,
        startingCashOnHand,
        bots,
      );
      //filter out all bot players
      const humanPlayers = players.filter((player) => !player.isBot);
      //add player ids to roomuser
      await Promise.all(
        humanPlayers.map((player) =>
          this.roomUserService.updateRoomUser({
            where: {
              userId_roomId: {
                userId: player.userId as string,
                roomId: roomId,
              },
            },
            data: {
              player: {
                connect: { id: player.id },
              },
            },
          }),
        ),
      );

      //calculate dynamic cert limit for game
      const certificateLimit = calculateCertLimitForPlayerCount(players.length);

      //update the game
      await this.gamesService.updateGame({
        where: { id: game.id },
        data: { certificateLimit },
      });
      // Randomly select 3 sectors
      const selectedSectors = this.getRandomElements(
        jsonData.sectors,
        3,
      ) as Sector[];

      // Prepare sectors and companies for batch creation
      const sectorData = selectedSectors.map((sector) => ({
        id: sector.id,
        name: sector.name,
        sectorName: sector.sectorName,
        supply: sector.supply,
        demand: 0, // Start with 0 demand - will be calculated from workers + brand bonus
        baseDemand: 0, // No base demand - demand comes from workers + brand bonus only
        consumers: 0,
        demandMin: 0,
        demandMax: 0,
        unitPriceMin: sector.unitPriceMin,
        unitPriceMax: sector.unitPriceMax,
        supplyDefault: sector.supplyDefault,
        marketingPrice: sector.marketingPrice,
        basePrice: sector.basePrice,
        ipoMin: sector.ipoMin,
        ipoMax: sector.ipoMax,
        sharePercentageToFloat: sector.sharePercentageToFloat,
        gameId: game.id,
      }));

      const amountOfStartingCompanies = calculateStartingCompanyCount(
        players.length,
      );

      const companyData = selectedSectors.flatMap((sector, sectorIndex) => {
        // Calculate how many companies each sector should get
        const baseCompanyCount = Math.floor(amountOfStartingCompanies / 3);
        const remainder = amountOfStartingCompanies % 3;

        // Distribute the remainder companies to the first sectors
        const extraCompany = sectorIndex < remainder ? 1 : 0;
        const companiesToSelect = baseCompanyCount + extraCompany;

        const companiesInSector = jsonData.companies.filter(
          (company) => company.sectorId === sector.id,
        );
        const selectedCompanies = this.getRandomElements(
          companiesInSector,
          companiesToSelect,
        );

        return selectedCompanies.map((company) => ({
          id: company.id,
          name: company.name,
          stockSymbol: company.stockSymbol,
          //find int between sector min and max
          unitPrice: Math.floor(
            Math.random() * (sector.unitPriceMax - sector.unitPriceMin + 1) +
              sector.unitPriceMin,
          ),
          throughput: company.throughput,
          companyTier: StartingTier[sector.sectorName as SectorName]
            .tier as CompanyTier,
          demandScore: 0,
          baseDemand: 0,
          supplyCurrent: 0,
          supplyMax:
            CompanyTierData[
              StartingTier[sector.sectorName as SectorName].tier as CompanyTier
            ].supplyMax,
          sectorId: sector.name, //map to name at first then match to supabase for id
          gameId: game.id,
        }));
      });
      let companies;
      let sectors: Sector[] = [];
      try {
        // Create sectors and companies
        sectors = await this.sectorService.createManySectors(sectorData);
        // sort sectors by default priority
        const sectorPrioritySorted = sectors.sort(
          (a, b) =>
            sectorPriority.indexOf(a.sectorName) -
            sectorPriority.indexOf(b.sectorName),
        );

        //create sector priorities
        const sectorPriorities = await this.prisma.sectorPriority.createMany({
          data: sectorPrioritySorted.map((sector, index) => ({
            sectorId: sector.id,
            gameId: game.id,
            priority: index + 1,
          })),
        });

        //map sector ids to names and update companyData
        const newCompanyData = companyData.map((company) => {
          const sector = sectors.find((s) => s.name === company.sectorId);
          if (!sector) {
            throw new Error('Sector not found');
          }
          return {
            ...company,
            stockTier: undefined,
            ipoAndFloatPrice: null,
            currentStockPrice: null,
            cashOnHand: 0,
            gameId: game.id,
            sectorId: sector.id,
          };
        });
        companies =
          await this.companyService.createManyCompanies(newCompanyData);

        //iterate through companies and create ipo shares
        // const shares: {
        //   companyId: string;
        //   price: number;
        //   location: ShareLocation;
        //   gameId: string;
        // }[] = [];
        // companies.forEach((company) => {
        //   for (let i = 0; i < DEFAULT_SHARE_DISTRIBUTION; i++) {
        //     shares.push({
        //       price: company.ipoAndFloatPrice,
        //       location: ShareLocation.IPO,
        //       companyId: company.id,
        //       gameId: game.id,
        //     });
        //   }
        // });
        // await this.shareService.createManyShares(shares);
      } catch (error) {
        console.error('Error starting game:', error);
        throw new Error('Failed to start the game');
      }
      let influenceRound: InfluenceRound | null;
      influenceRound = await this.influenceRoundService.createInfluenceRound({
        roundStep: 0,
        maxInfluence: DEFAULT_INFLUENCE,
        Game: { connect: { id: game.id } },
        GameTurn: { connect: { id: newTurn.id } },
      });
      if (!influenceRound) {
        throw new Error('Failed to create influence round');
      }

      //if modern operation mechanics version, create the initial resource track values
      if(operationMechanicsVersion === OperationMechanicsVersion.MODERN) {
        if (sectors.length === 0) {
          // Fetch sectors from database if they weren't created (shouldn't happen, but safety check)
          sectors = await this.sectorService.sectors({
            where: { gameId: game.id },
          });
        }
        await this.createInitialResourceTrackValues(game.id, sectors);
        await this.initializeConsumptionBags(game.id, sectors);
      }
      // Start the stock round phase
      const newPhase = await this.startPhase({
        gameId: game.id,
        influenceRoundId: influenceRound.id,
        phaseName: PhaseName.INFLUENCE_BID_ACTION,
        roundType: RoundType.INFLUENCE,
      });
      //iterate through companies and create initial stock history
      const stockHistories: {
        companyId: string;
        price: number;
        gameId: string;
        phaseId: string;
        stepsMoved: number;
        action: StockAction;
      }[] = [];
      //create initial stock history for starting stock price
      companies.forEach((company) => {
        stockHistories.push({
          companyId: company.id,
          price: company.currentStockPrice || 0,
          gameId: game.id,
          phaseId: newPhase.id || '',
          stepsMoved: 0,
          action: StockAction.INITIAL,
        });
      });
      await this.stockHistoryService.createManyStockHistories(stockHistories);
      const capitalInjections: number[] = [];
      //create capital injection array if it exists
      const prestigeTrack = createPrestigeTrackBasedOnSeed(game.id);
      //look for capital injection spaces
      prestigeTrack.forEach((trackItem) => {
        if (trackItem.type == PrestigeReward.CAPITAL_INJECTION) {
          capitalInjections.push(CAPITAL_INJECTION_STARTER);
        }
      });
      if (capitalInjections.length > 0) {
        //update game with capital injection values
        await this.gamesService.updateGame({
          where: { id: game.id },
          data: { capitalInjectionRewards: capitalInjections },
        });
      }
      //create the rewards tracks
      this.createAwardsTracks(game.id);

      if (!game.isTimerless) {
        // Start the timer for advancing to the next phase
        //TODO: Once the game is fully implemented, we can start the timer service again.  Something is wrong with it right now.
        await this.startPhaseTimer({
          phase: newPhase,
          gameId: game.id,
          influenceRoundId: influenceRound.id,
        });
      }
      return game;
    } catch (error) {
      console.error('Error starting game:', error);
      throw new Error('Failed to start the game');
    }
  }

  async createInitialResourceTrackValues(gameId: string, sectors: Sector[]) {
    //create the three general resources, circle, square and triangle
    let resources: any = [
        {
          gameId,
          type: ResourceType.CIRCLE,
          trackType: ResourceTrackType.GLOBAL,
          price: RESOURCE_PRICES_CIRCLE[0],
          trackPosition: 0,
        },
        {
          gameId,
          type: ResourceType.SQUARE,
          trackType: ResourceTrackType.GLOBAL,
          price: RESOURCE_PRICES_SQUARE[0],
          trackPosition: 0,
        },
        {
          gameId,
          type: ResourceType.TRIANGLE,
          trackType: ResourceTrackType.GLOBAL,
          price: RESOURCE_PRICES_TRIANGLE[0],
          trackPosition: 0,
        },
      ];
      //iterate over sectors and add the resource track values to the resources array
      sectors.forEach((sector) => {
        const sectorResourceType = getSectorResourceForSectorName(sector.sectorName);
        const priceArray = getResourcePriceForResourceType(sectorResourceType);
        const initialPrice = priceArray.length > 0 ? priceArray[0] : 0;
        
        resources.push({
          gameId,
          type: sectorResourceType,
          trackType: ResourceTrackType.SECTOR,
          price: initialPrice,
          trackPosition: 0,
        });
      });
      //create the resources
      await this.resourceService.createManyResources(resources);
  }

  /**
   * Initialize consumption bags for all sectors with 5 permanent sector-specific markers each
   */
  async initializeConsumptionBags(gameId: string, sectors: Sector[]) {
    const markers: any[] = [];
    
    for (const sector of sectors) {
      const sectorResourceType = getSectorResourceForSectorName(sector.sectorName);
      
      // Add 5 permanent sector-specific markers to each sector's consumption bag
      for (let i = 0; i < 5; i++) {
        markers.push({
          gameId,
          sectorId: sector.id,
          resourceType: sectorResourceType,
          isPermanent: true,
          companyId: null,
        });
      }
    }

    // Create all consumption markers
    await this.prisma.consumptionMarker.createMany({
      data: markers,
    });

    await this.gameLogService.createGameLog({
      game: { connect: { id: gameId } },
      content: 'Consumption bags initialized for all sectors',
    });
  }

  async createAwardsTracks(gameId: string) {
    this.companyAwardTrackService.createAwardTrackAndSpaces(
      gameId,
      'Research',
      AwardTrackType.RESEARCH,
    );
    this.companyAwardTrackService.createAwardTrackAndSpaces(
      gameId,
      'Marketing',
      AwardTrackType.MARKETING,
    );
    this.companyAwardTrackService.createAwardTrackAndSpaces(
      gameId,
      'Catalyst',
      AwardTrackType.CATALYST,
    );
  }

  async createResearchDeck(gameId: string) {
    let researchCards = createSeededResearchCards(gameId);
    if (!researchCards || !Array.isArray(researchCards)) {
      throw new Error('No cards generated');
    }
    const researchDeck = await this.researchDeckService.createResearchDeck({
      Game: { connect: { id: gameId } },
    });

    researchCards = researchCards.map((card) => ({
      ...card,
      gameId,
      deckId: researchDeck.id,
    }));
    const createdResearchCards =
      await this.cardsService.createManyCards(researchCards);
    return this.researchDeckService.updateResearchDeck({
      where: { id: researchDeck.id },
      data: {
        cards: {
          connect: createdResearchCards.map((card) => ({ id: card.id })),
        },
      },
    });
  }

  public getRandomElements<T>(arr: T[], n: number): T[] {
    const result = new Array(n);
    let len = arr.length;
    const taken = new Array(len);
    if (n > len)
      throw new RangeError(
        'getRandomElements: more elements taken than available',
      );
    while (n--) {
      const x = Math.floor(Math.random() * len);
      result[n] = arr[x in taken ? taken[x] : x];
      taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
  }

  public getPlayersWithShares(
    gameId: string,
  ): Promise<PlayerWithShares[] | null> {
    return this.playersService.playersWithShares({
      gameId,
    });
  }

  public getCurrentGameState(gameId: string): Promise<GameState | null> {
    return this.gamesService.getGameState(gameId);
  }

  public async determineIfNewRoundAndStartRound({
    gameId,
    gameState,
    phaseName,
    stockRoundId,
    operatingRoundId,
    influenceRoundId,
    roundType,
    companyId,
  }: any) {
    let currentPhaseTime = Date.now();
    const currentPhase = await this.phaseService.phase({
      id: gameState.currentPhaseId || '',
    });
    if (!currentPhase) {
      throw new Error('Phase not found');
    }
    let currentOperatingRound: OperatingRound | null = null;
    if (gameState.currentOperatingRoundId) {
      let operatingRoundTime = Date.now();
      //get current operating round
      currentOperatingRound = await this.operatingRoundService.operatingRound({
        id: gameState.currentOperatingRoundId,
      });
      if (!currentOperatingRound) {
        throw new Error('Current operating round not found');
      }
    }
    let newStockRound: StockRound | null = null;
    let newOperatingRound: OperatingRound | null = null;
    // If the current phase roundtype is different to the new one, initiate the new round
    if (gameState.currentRound !== roundType) {
      //start new round
      if (roundType === RoundType.STOCK) {
        const result = await this.startStockRound(gameId, gameState);
        if (result?.stockRound) {
          newStockRound = result?.stockRound;
        }
      } else if (roundType === RoundType.OPERATING) {
        newOperatingRound = await this.startOperatingRound(gameId, gameState);
      } else if (roundType === RoundType.GAME_UPKEEP) {
        await this.gamesService.updateGameState({
          where: { id: gameId },
          data: {
            currentRound: RoundType.GAME_UPKEEP,
          },
        });
      }
    } else if (
      gameState.currentRound === RoundType.OPERATING &&
      (!gameState.currentOperatingRoundId ||
        (currentOperatingRound &&
          currentOperatingRound.gameTurnId !== gameState.currentTurn))
    ) {
      console.error(
        'No current operating round found, this is an assertion basically and we should never get here.',
      );
      newOperatingRound = await this.startOperatingRound(gameId, gameState);
    } else if (
      gameState.currentRound == RoundType.STOCK &&
      !gameState.currentStockRoundId
    ) {
      const result = await this.startStockRound(gameId, gameState);
      if (result?.stockRound) {
        newStockRound = result?.stockRound;
      }
    }
    //conditional checks that are basically fail states for assertions
    if (
      !stockRoundId &&
      !newStockRound &&
      roundType === RoundType.STOCK &&
      gameState.currentStockRoundId
    ) {
      console.error('No stock round id found, this is basically an assertion.');
      stockRoundId = gameState.currentStockRoundId;
    }
    if (
      !operatingRoundId &&
      !newOperatingRound &&
      roundType === RoundType.OPERATING &&
      gameState.currentOperatingRoundId
    ) {
      console.error(
        'No operating round id found, this is basically an assertion.',
      );
      operatingRoundId = gameState.currentOperatingRoundId;
    }
    const _stockRoundId =
      roundType === RoundType.STOCK
        ? newStockRound
          ? newStockRound.id
          : stockRoundId
        : undefined;
    const _operatingRoundId =
      roundType === RoundType.OPERATING
        ? newOperatingRound
          ? newOperatingRound.id
          : operatingRoundId
        : undefined;
    const _influenceRoundId =
      roundType === RoundType.INFLUENCE ? influenceRoundId : undefined;
    return {
      stockRoundId: _stockRoundId,
      operatingRoundId: _operatingRoundId,
      influenceRoundId: _influenceRoundId,
    };
  }
  /**
   * Arg data here stipulates data for the next phase with phaseName and companyId
   *
   * @param param0
   * @returns
   */
  public async determineIfNewRoundAndStartPhase({
    gameId,
    gameState,
    phaseName,
    roundType,
    stockRoundId,
    stockSubRoundId,
    operatingRoundId,
    influenceRoundId,
    companyId,
  }: {
    gameId: string;
    gameState: GameState;
    phaseName: PhaseName;
    roundType: RoundType;
    stockRoundId?: string;
    stockSubRoundId?: string;
    operatingRoundId?: string;
    influenceRoundId?: number;
    companyId?: string;
  }) {
    //ensure player ready up is reset for next phase
    this.resetPlayerReadiness(gameId);

    return this.startPhase({
      gameId,
      phaseName,
      roundType,
      stockRoundId: stockRoundId,
      stockSubRoundId: stockSubRoundId,
      operatingRoundId: operatingRoundId,
      influenceRoundId: influenceRoundId,
      companyId,
      gameState,
    });
  }

  public async startStockRound(
    gameId: string,
    gameState?: GameState,
  ): Promise<{ stockRound: StockRound } | null> {
    //get game
    let game;
    if (gameState) {
      game = await this.gamesService.getGameState(gameId);
    } else {
      game = await this.gamesService.game({ id: gameId });
    }
    const stockRound = await this.stockRoundService.createStockRound({
      Game: { connect: { id: gameId } },
      GameTurn: { connect: { id: game?.currentTurn } },
    });
    //update game
    await this.gamesService.updateGameState({
      where: { id: gameId },
      data: {
        currentRound: RoundType.STOCK,
        currentStockRoundId: stockRound.id,
      },
    });
    return { stockRound };
  }

  public async startOperatingRound(
    gameId: string,
    gameState?: GameState,
  ): Promise<OperatingRound | null> {
    //get game
    let game;
    if (gameState) {
      game = gameState;
    } else {
      game = await this.gamesService.getGameState(gameId);
    }
    const operatingRound =
      await this.operatingRoundService.createOperatingRound({
        Game: { connect: { id: gameId } },
        GameTurn: { connect: { id: game?.currentTurn } },
      });
    //update game
    await this.gamesService.updateGameState({
      where: { id: gameId },
      data: {
        currentRound: RoundType.OPERATING,
        currentOperatingRoundId: operatingRound.id,
      },
    });
    return operatingRound;
  }

  /**
   * This is the main recurring game-loop.
   * The entire game operates on timers so
   * we can assume a recursive loop to invoke
   * each game phase.
   *
   * TODO: Considerations for retrying failed phase transitions and the ability
   * for the game to start from any point should the server restart.
   *
   * @param gameId
   * @param phaseName
   * @param roundType
   * @param stockRoundId
   * @param operatingRoundId
   */
  async startPhase({
    gameId,
    phaseName,
    roundType,
    stockRoundId,
    stockSubRoundId,
    operatingRoundId,
    influenceRoundId,
    companyId,
    gameState,
  }: {
    gameId: string;
    phaseName: PhaseName;
    roundType: RoundType;
    stockRoundId?: string;
    stockSubRoundId?: string;
    operatingRoundId?: string;
    influenceRoundId?: number;
    companyId?: string;
    gameState?: GameState;
  }) {
    const gameChannelId = getGameChannelId(gameId);
    let game;
    //get game
    if (!gameState) {
      game = await this.gamesService.getGameState(gameId);
    } else {
      game = gameState;
    }
    let extraPhaseTime = 0;
    //get company
    if (companyId) {
      const companyTime = Date.now();
      const company = await this.companyService.company({
        id: companyId || '',
      });
      if (company) {
        if (
          phaseName == PhaseName.OPERATING_ACTION_COMPANY_VOTE &&
          company.status == CompanyStatus.INSOLVENT
        ) {
          extraPhaseTime = INSOLVENT_EXTRA_PHASE_TIME;
        }
      }
    }
    let phase = await this.phaseService.createPhase({
      name: phaseName,
      phaseTime: phaseTimes[phaseName] + extraPhaseTime,
      Game: { connect: { id: gameId } },
      GameTurn: { connect: { id: game?.currentTurn || '' } },
      StockRound: stockRoundId ? { connect: { id: stockRoundId } } : undefined,
      StockSubRound: stockSubRoundId
        ? { connect: { id: stockSubRoundId } }
        : undefined,
      OperatingRound: operatingRoundId
        ? { connect: { id: operatingRoundId } }
        : undefined,
      InfluenceRound: influenceRoundId
        ? { connect: { id: influenceRoundId } }
        : undefined,
      Company: companyId ? { connect: { id: companyId } } : undefined,
    });

    // Update game state
    let updateGameTime = Date.now();
    game = await this.gamesService.updateGameState({
      where: { id: gameId },
      data: {
        currentPhaseId: phase.id,
        //TODO: is this necessary?
        // currentStockRoundId: stockRoundId,
        // currentOperatingRoundId: operatingRoundId,
      },
    });
    try {
      let handlePhaseTime = Date.now();
      await this.handlePhase(phase, game);
    } catch (error) {
      console.error('Error during phase:', error);
      // Optionally handle retries or fallback logic here
    }
    try {
      this.pusherService.trigger(
        getGameChannelId(gameId),
        EVENT_NEW_PHASE,
        phaseName,
      );
    } catch (error) {
      console.error('Error triggering new phase:', error);
    }
    //create phase start time
    phase = await this.phaseService.updatePhase({
      where: { id: phase.id },
      data: { phaseStartTime: new Date() },
    });
    // Return the created phase for further processing if needed
    return phase;
  }

  async retryPhase(gameId: string) {
    const game = await this.gamesService.getGameState(gameId);

    if (!game) {
      throw new Error('Game not found');
    }

    const currentPhase = await this.phaseService.phase({
      id: game.currentPhaseId || '',
    });

    if (!currentPhase) {
      throw new Error('Phase not found');
    }

    // Retry the phase
    await this.startPhase({
      gameId,
      phaseName: currentPhase.name,
      roundType: currentPhase.stockRoundId
        ? RoundType.STOCK
        : currentPhase.operatingRoundId
          ? RoundType.OPERATING
          : currentPhase.influenceRoundId
            ? RoundType.INFLUENCE
            : RoundType.GAME_UPKEEP,
      stockRoundId: game.currentStockRoundId || undefined,
      stockSubRoundId: currentPhase.stockSubRoundId || undefined,
      operatingRoundId: game.currentOperatingRoundId || undefined,
      influenceRoundId: game.InfluenceRound?.[0].id || undefined,
      companyId: currentPhase.companyId || '',
    });
  }

  /**
   * This function starts the timer for the current phase and advances to the next phase.
   *
   * @param phase - The next phase object.
   * @param gameId - ID of the game.
   * @param stockRoundId - Optional ID of the stock round.
   * @param operatingRoundId - Optional ID of the operating round.
   */
  private async startPhaseTimer({
    phase,
    gameId,
    stockRoundId,
    operatingRoundId,
    influenceRoundId,
  }: {
    phase: Phase;
    gameId: string;
    stockRoundId?: string;
    operatingRoundId?: string;
    influenceRoundId?: number;
  }) {
    await this.timerService.setTimer(
      phase.id,
      phase.gameId,
      phase.phaseTime,
      phase?.phaseStartTime?.getTime() || Date.now(),
      async () => {
        try {
          await this.handlePhaseTransition({
            phase,
            gameId,
          });
        } catch (error) {
          console.error('Error during phase transition:', error);
          // Optionally handle retries or fallback logic here
        }
      },
    );
  }

  private async endPhaseTimer(phaseId: string) {
    await this.timerService.clearTimer(phaseId);
  }

  private async handlePhaseTransition({
    phase,
    gameId,
  }: {
    phase: Phase;
    gameId: string;
  }) {
    // Fetch necessary data upfront
    let gameStateTime = Date.now();
    const [gameState] = await Promise.all([
      this.gamesService.getGameState(gameId),
    ]);
    if (!gameState) {
      throw new Error('Game state not found');
    }

    if (gameState?.gameStatus === GameStatus.FINISHED) {
      return;
    }

    // NEW: Stock rounds no longer use sub-rounds - all orders are placed in one phase
    // The stockActionSubRoundIsOver option is no longer needed for the new single-round system
    const determinedNextPhase = determineNextGamePhase(
      phase.name,
      {
        stockActionSubRoundIsOver: true, // Always true now - no more sub-rounds
      },
      gameState.operationMechanicsVersion === OperationMechanicsVersion.MODERN,
    );

    // NEW: Stock rounds no longer use sub-rounds, so stockActionSubRoundIsOver is always true
    let adjustedPhase = await this.findNextPhaseThatShouldBePlayed(
      determinedNextPhase,
      phase,
      gameState,
      true, // Always true now - no more sub-rounds
    );

    //start new round if necessary
    const roundPhaseIds = await this.determineIfNewRoundAndStartRound({
      gameId,
      gameState,
      phaseName: phase.name,
      stockRoundId: phase.stockRoundId || undefined,
      operatingRoundId: phase.operatingRoundId || undefined,
      influenceRoundId: phase.influenceRoundId || undefined,
      roundType: adjustedPhase.roundType || undefined,
      companyId: phase.companyId || undefined,
    });

    let startTimeHandleNextPhase = Date.now();
    const nameAndRoundTypeAndCompanyForNextPhase =
      await this.determineAndHandleNextPhase({
        phase,
        gameId,
        gameState,
        stockActionSubRoundIsOver: true, // Always true now - no more sub-rounds
      });
    let startTime = Date.now();
    const nextPhase = await this.determineIfNewRoundAndStartPhase({
      gameId,
      gameState,
      phaseName: nameAndRoundTypeAndCompanyForNextPhase.phaseName,
      roundType: nameAndRoundTypeAndCompanyForNextPhase.roundType,
      stockRoundId: roundPhaseIds.stockRoundId || undefined,
      //TODO: Don't really like this, need to rethink implementation
      stockSubRoundId: roundPhaseIds.stockRoundId
        ? phase?.stockSubRoundId || undefined
        : undefined,
      operatingRoundId: roundPhaseIds.operatingRoundId || undefined,
      influenceRoundId: roundPhaseIds.influenceRoundId || undefined,
      companyId:
        nameAndRoundTypeAndCompanyForNextPhase.companyId ||
        phase?.companyId ||
        '',
    });
    if (!gameState.isTimerless) {
      await this.startPhaseTimer({
        phase: nextPhase,
        gameId,
        stockRoundId: nextPhase.stockRoundId || undefined,
        operatingRoundId: nextPhase.operatingRoundId || undefined,
        influenceRoundId: nextPhase.influenceRoundId || undefined,
      });
    }
    //poll again for player readiness
    this.pusherService.trigger(
      getGameChannelId(gameId),
      EVENT_PLAYER_READINESS_CHANGED,
    );
  }

  /**
   * Determines and handles the transition to the next phase.
   * @param phase - The current phase object.
   * @param gameId - ID of the game.
   * @param stockRoundId - Optional ID of the stock round.
   * @param operatingRoundId - Optional ID of the operating round.
   * @returns The next phase object.
   */
  private async determineAndHandleNextPhase({
    phase,
    gameId,
    gameState,
    stockActionSubRoundIsOver,
  }: {
    phase: Phase;
    gameId: string;
    gameState: GameState;
    stockActionSubRoundIsOver?: boolean;
  }): Promise<{
    phaseName: PhaseName;
    roundType: RoundType;
    companyId?: string;
  }> {
    const determinedNextPhase = determineNextGamePhase(
      phase.name,
      {
        stockActionSubRoundIsOver,
      },
      gameState.operationMechanicsVersion === OperationMechanicsVersion.MODERN,
    );

    let nextPhaseTimer = Date.now();
    let nextPhase = await this.findNextPhaseThatShouldBePlayed(
      determinedNextPhase,
      phase,
      gameState,
      stockActionSubRoundIsOver,
    );
    let companyId: string | undefined;
    if (nextPhase.phaseName === PhaseName.OPERATING_ACTION_COMPANY_VOTE) {
      companyId =
        (await this.handleOperatingActionCompanyVote(
          nextPhase.phaseName,
          phase,
          gameId,
          gameState,
        )) || undefined;
      if (!companyId) {
        nextPhase.phaseName = PhaseName.OPERATING_PRODUCTION;
      }
    } else {
      companyId = phase.companyId || undefined;
    }

    return {
      phaseName: nextPhase.phaseName,
      roundType: nextPhase.roundType,
      companyId,
    };
  }

  /**
   * Adjusts the next phase based on the current game state.
   * @param nextPhase - The next phase object.
   * @param currentPhase - The current phase object.
   * @param gameId - ID of the game.
   * @returns The adjusted next phase object.
   */
  private async findNextPhaseThatShouldBePlayed(
    nextPhase: {
      phaseName: PhaseName;
      roundType: RoundType;
    },
    currentPhase: Phase,
    gameState: GameState,
    stockActionSubRoundIsOver?: boolean,
  ): Promise<{
    phaseName: PhaseName;
    roundType: RoundType;
  }> {
    let doesNextPhaseNeedToBePlayed = await this.doesNextPhaseNeedToBePlayed(
      nextPhase.phaseName,
      currentPhase,
    );

    while (!doesNextPhaseNeedToBePlayed) {
      nextPhase = determineNextGamePhase(
        nextPhase.phaseName,
        {
          stockActionSubRoundIsOver,
        },
        gameState.operationMechanicsVersion ===
          OperationMechanicsVersion.MODERN,
      );
      doesNextPhaseNeedToBePlayed = await this.doesNextPhaseNeedToBePlayed(
        nextPhase.phaseName,
        currentPhase,
      );
    }

    return nextPhase;
  }

  /**
   * Handles the logic for the OPERATING_ACTION_COMPANY_VOTE phase.
   * @param nextPhase - The next phase object.
   * @param currentPhase - The current phase object.
   * @param gameId - ID of the game.
   * @returns The company ID for the next phase.
   */
  private async handleOperatingActionCompanyVote(
    nextPhase: PhaseName,
    currentPhase: Phase,
    gameId: string,
    gameState: GameState,
  ): Promise<string | undefined> {
    // Use gameState passed from the parent function
    const insolventCompanies = gameState.Company.filter(
      (company) => company.status === CompanyStatus.INSOLVENT,
    );
    //if there are insolvent companies, resolve the first one
    //as companies that are insolvent ultimately resolve into one of two states, bankrupt or active, we should
    //be able to safely assume that this check will ultimately pass and continue onto active companies
    if (insolventCompanies.length > 0) {
      return insolventCompanies[0].id;
    }

    const allActiveCompaniesVoted =
      await this.haveAllActiveCompaniesActionsResolved(gameId);

    if (allActiveCompaniesVoted) {
      return undefined;
    } else {
      if (
        currentPhase?.companyId &&
        (currentPhase.name === PhaseName.OPERATING_COMPANY_VOTE_RESOLVE ||
          currentPhase.name === PhaseName.OPERATING_ACTION_COMPANY_VOTE ||
          currentPhase.name === PhaseName.OPERATING_ACTION_COMPANY_VOTE_RESULT)
      ) {
        if (!gameState.currentOperatingRoundId) {
          throw new Error('Operating round not found');
        }

        const activeCompanies =
          await this.companyService.companiesWithCompanyActionsWithActionsFilteredByOperatingRoundId(
            gameState.currentOperatingRoundId,
            {
              where: {
                gameId,
                status: CompanyStatus.ACTIVE,
              },
            },
          );

        const nextCompanyId = this.getNextCompanyId(
          activeCompanies,
          currentPhase?.companyId,
          gameState.currentTurn,
        );

        return nextCompanyId;
      } else {
        let companyActionOrders =
          await this.companyActionOrderService.listCompanyActionOrders({
            where: {
              gameTurnId: gameState.currentTurn,
            },
          });

        if (!companyActionOrders || companyActionOrders.length == 0) {
          await this.lockCompanyActions(currentPhase);
          companyActionOrders =
            await this.companyActionOrderService.listCompanyActionOrders({
              where: {
                gameTurnId: gameState.currentTurn,
              },
            });

          if (!companyActionOrders || companyActionOrders.length == 0) {
            throw new Error('Company action orders not found');
          }
        }
        //this should be the first company in the operating round
        return getNextCompanyOperatingRoundTurn(
          gameState.Company.filter(
            (company) => company.status == CompanyStatus.ACTIVE,
          ),
          companyActionOrders,
        )?.id;
      }
    }
  }

  async getNextCompanyId(
    activeCompanies: CompanyWithCompanyActions[],
    currentCompanyId: string | undefined,
    currentTurnId: string,
  ): Promise<string | undefined> {
    //get company action orders
    const companyActionOrders =
      await this.companyActionOrderService.listCompanyActionOrders({
        where: {
          gameTurnId: currentTurnId,
        },
      });
    if (!companyActionOrders || companyActionOrders.length == 0) {
      throw new Error('Company action orders not found');
    }
    const nextCompanyId = getNextCompanyOperatingRoundTurn(
      activeCompanies,
      companyActionOrders,
      currentCompanyId,
    )?.id;

    if (!nextCompanyId) {
      return undefined;
    }

    //if all companies have resolved actions, return undefined
    if (
      activeCompanies.every((company) =>
        company.CompanyActions.some(
          (action) => action.gameTurnId === currentTurnId && action.resolved,
        ),
      )
    ) {
      return undefined;
    }
    // Get this company's actions for the current turn
    const companyActions = activeCompanies
      .find((company) => company.id === nextCompanyId)
      ?.CompanyActions.filter((action) => action.gameTurnId === currentTurnId);

    // If this company has at least one resolved action, recursively find the next company
    if (
      companyActions &&
      companyActions.length > 0 &&
      companyActions.some((action) => action.resolved)
    ) {
      return this.getNextCompanyId(
        activeCompanies,
        nextCompanyId,
        currentTurnId,
      );
    }
    // Return the next company ID if it doesn't have any resolved actions
    return nextCompanyId;
  }

  /**
   * Limit orders are filled on the fly as the game progresses during operations and other stock round actions,
   * when limit orders are resolved, we fulfill any orders pending settlement by collecting money and distributing shares for buys
   * or paying out money and removing shares for sells.
   * @param phase
   */
  async resolveLimitOrders(phase: Phase) {
    const playerOrders: PlayerOrderWithPlayerCompany[] =
      await this.playerOrderService.playerOrdersWithPlayerCompany({
        where: {
          gameId: phase.gameId,
          orderType: OrderType.LIMIT,
          orderStatus: OrderStatus.FILLED_PENDING_SETTLEMENT,
        },
      });
    if (!playerOrders) {
      throw new Error('Player Orders not found');
    }
    //pay out all limit orders that are buys by increasing cash on hand by the current stock price and adding share to portfolio
    playerOrders.forEach(async (order) => {
      if (!order.Company) {
        throw new Error('Company not found');
      }
      //restore limit order action
      this.playersService.addActionCounter(order.playerId, order.orderType);

      if (order.isSell) {
        //remove one share from the player's portfolio
        // Note: We are instead allowing for as many shares as you like to be sold via limit order
        // const share = await this.prisma.share.findFirst({
        //   where: {
        //     playerId: order.playerId,
        //     companyId: order.companyId,
        //     location: ShareLocation.PLAYER,
        //   },
        // });
        // await this.shareService.updateManySharesUnchecked({
        //   where: { id: share.id },
        //   data: { playerId: null, location: ShareLocation.OPEN_MARKET },
        // });

        const shares = await this.shareService.shares({
          where: {
            playerId: order.playerId,
            companyId: order.companyId,
            location: ShareLocation.PLAYER,
          },
          take: order.quantity || 0,
        });
        if (!shares || shares.length < (order.quantity || 0)) {
          //reject the order
          await this.prisma.playerOrder.update({
            where: { id: order.id },
            data: {
              orderStatus: OrderStatus.REJECTED,
            },
          });
          //game log
          await this.gameLogService.createGameLog({
            content: `Limit order sell for ${order.Company.stockSymbol} rejected due to insufficient shares`,
            game: { connect: { id: order.gameId } },
          });
        } else {
          await this.playerAddMoney({
            gameId: order.gameId,
            gameTurnId: phase.gameTurnId,
            phaseId: phase.id,
            playerId: order.playerId,
            amount: (order.value || 0) * (order.quantity || 0),
            fromEntity: EntityType.BANK,
            description: `Limit order sell for ${order.Company.stockSymbol}`,
            transactionSubType: TransactionSubType.LIMIT_SELL,
          });
          //update share location to open market
          await this.shareService.updateManySharesUnchecked({
            where: { id: { in: shares.map((share) => share.id) } },
            data: { playerId: null, location: ShareLocation.OPEN_MARKET },
          });
          //game log
          await this.gameLogService.createGameLog({
            content: `Limit order sell for ${order.Company.stockSymbol} completed`,
            game: { connect: { id: order.gameId } },
          });
        }
      } else {
        //if player does not have enough money, reject the order
        if ((order.value || 0) > order.Player.cashOnHand) {
          await this.prisma.playerOrder.update({
            where: { id: order.id },
            data: {
              orderStatus: OrderStatus.REJECTED,
            },
          });
          //game log
          await this.gameLogService.createGameLog({
            content: `Limit order buy for ${order.Company.stockSymbol} rejected due to insufficient funds`,
            game: { connect: { id: order.gameId } },
          });
          return;
        } else {
          //buy order
          this.playerRemoveMoney(
            order.gameId,
            order.gameTurnCreated,
            order.phaseId,
            order.playerId,
            order.value || 0,
            EntityType.BANK,
            `Limit order buy for ${order.Company.stockSymbol}`,
          );

          //move share from open market to player portfolio
          const share = await this.prisma.share.findFirst({
            where: {
              playerId: null,
              companyId: order.companyId,
              location: ShareLocation.OPEN_MARKET,
            },
          });
          if (!share) {
            throw new Error('Share not found');
          }
          //update share location to player
          await this.shareService.updateShare({
            where: { id: share.id },
            data: {
              location: ShareLocation.PLAYER,
              Player: { connect: { id: order.playerId } },
            },
          });
          //game log
          await this.gameLogService.createGameLog({
            content: `Limit order buy for ${order.Company.stockSymbol} completed`,
            game: { connect: { id: order.gameId } },
          });
        }
      }
    });
  }
  async openLimitOrders(phase: Phase) {
    if (phase.stockRoundId) {
      const playerOrders: PlayerOrderWithPlayerCompany[] =
        await this.playerOrderService.playerOrdersWithPlayerCompany({
          where: {
            stockRoundId: phase.stockRoundId,
            orderType: OrderType.LIMIT,
            orderStatus: OrderStatus.PENDING,
          },
        });
      if (!playerOrders) {
        throw new Error('Stock round not found');
      }
      //update all orders to be pending settlement
      await Promise.all(
        playerOrders.map(async (order) => {
          await this.prisma.playerOrder.update({
            where: { id: order.id },
            data: {
              orderStatus: OrderStatus.OPEN,
            },
          });
        }),
      );
    }
  }

  async openOptionsOrders(phase: Phase) {
    if (phase.stockRoundId) {
      const playerOrders: PlayerOrderWithPlayerCompany[] =
        await this.playerOrderService.playerOrdersWithPlayerCompany({
          where: {
            stockRoundId: phase.stockRoundId,
            orderType: OrderType.OPTION,
            orderStatus: OrderStatus.PENDING,
          },
        });
      if (!playerOrders) {
        throw new Error('Stock round not found');
      }
      // Get game
      const game = await this.gamesService.getGameState(phase.gameId);
      if (!game) {
        throw new Error('Game not found');
      }
      // Group player options order by contract id
      const groupedOrders: { [key: number]: PlayerOrderWithPlayerCompany[] } =
        playerOrders.reduce(
          (acc, order) => {
            if (!order.optionContractId) {
              throw new Error('Option contract not found');
            }
            if (order.optionContractId in acc) {
              acc[order.optionContractId].push(order);
            } else {
              acc[order.optionContractId] = [order];
            }
            return acc;
          },
          {} as { [key: number]: PlayerOrderWithPlayerCompany[] },
        );

      // Iterate over grouped orders and resolve them
      await Promise.all(
        Object.values(groupedOrders).map(async (orders) => {
          // Group orders by phaseId
          const groupedByPhase = orders.reduce(
            (acc, order) => {
              const phaseId = order.phaseId;
              if (!acc[phaseId]) {
                acc[phaseId] = [];
              }
              acc[phaseId].push(order);
              return acc;
            },
            {} as { [key: string]: PlayerOrderWithPlayerCompany[] },
          );
          // TODO: This is not sorting by phases, not sure what the original intention was here
          // Sort phases by phase creation time
          const sortedPhases = Object.entries(groupedByPhase).sort(
            ([phaseIdA], [phaseIdB]) =>
              new Date(groupedByPhase[phaseIdA][0].createdAt).getTime() -
              new Date(groupedByPhase[phaseIdB][0].createdAt).getTime(),
          );

          // Iterate over sorted phases and resolve orders
          for (const [, phaseOrders] of sortedPhases) {
            if (phaseOrders.length > 1) {
              // If multiple orders in the same phase, resolve by bid value
              const playerIds = phaseOrders.map((order) => order.playerId);
              // Get player priorities
              const playerPriorities = await this.fetchPlayerPriorities(
                playerIds,
              );
              let sortedOrders: PlayerOrderWithPlayerCompany[] | undefined;
              if (
                game.distributionStrategy === DistributionStrategy.BID_PRIORITY
              ) {
                const sortedByBidValue = this.sortByBidValue(
                  phaseOrders,
                  playerPriorities,
                );
                sortedOrders = sortedByBidValue;
              }
              if (game.distributionStrategy === DistributionStrategy.PRIORITY) {
                const sortedByBidValue = this.sortByPlayerPriority(
                  phaseOrders,
                  playerPriorities,
                );
                sortedOrders = sortedByBidValue;
              }
              if (!sortedOrders) {
                //exit iteration
                continue;
              }
              // Reject all orders except the first
              await Promise.all(
                sortedOrders.slice(1).map(async (order) => {
                  await this.prisma.playerOrder.update({
                    where: { id: order.id },
                    data: {
                      orderStatus: OrderStatus.REJECTED,
                    },
                  });
                }),
              );
              // Update the first order to be FILLED
              const playerOrderResolved = await this.prisma.playerOrder.update({
                where: { id: sortedOrders[0].id },
                data: {
                  orderStatus: OrderStatus.OPEN,
                },
              });
              // Update the contract
              await this.optionContractService.updateOptionContract({
                where: { id: sortedOrders[0].optionContractId || 0 },
                data: {
                  contractState: ContractState.PURCHASED,
                  currentPremium: sortedOrders[0].value || 0,
                },
              });
              // Remove premium from players' cash on hand
              await this.playerRemoveMoney(
                phase.gameId,
                phase.gameTurnId,
                phase.id,
                playerOrderResolved.playerId,
                playerOrderResolved.value || 0,
                EntityType.BANK,
                `Option contract purchased.`,
              );
            } else {
              // If only one order in this phase, fulfill it directly
              const playerOrderResolved = await this.prisma.playerOrder.update({
                where: { id: phaseOrders[0].id },
                data: {
                  orderStatus: OrderStatus.OPEN,
                },
              });
              // Update the contract
              await this.optionContractService.updateOptionContract({
                where: { id: phaseOrders[0].optionContractId || 0 },
                data: {
                  contractState: ContractState.PURCHASED,
                  currentPremium: phaseOrders[0].value || 0,
                },
              });
              // Remove premium from players' cash on hand
              await this.playerRemoveMoney(
                phase.gameId,
                phase.gameTurnId,
                phase.id,
                playerOrderResolved.playerId,
                playerOrderResolved.value || 0,
                EntityType.BANK,
                `Option contract purchased.`,
              );
            }
          }
        }),
      );
    }
  }

  /**
   * Cycle the option contract tableau when a contract is purchased.
   * Purchasing a contract removes it from the tableau and "pushes up" any contracts behind it.
   * A new contract is generated to fill the queued space.
   *
   * @param gameId
   * @param optionContract
   */
  async cycleOptionContractsOnTableau(
    gameId: string,
    optionContract: OptionContract,
  ) {
    // Get companies
    const companies = await this.companyService.companiesWithSector({
      where: { gameId },
    });
    if (!companies) {
      throw new Error('Companies not found');
    }

    const optionContracts =
      await this.optionContractService.listOptionContracts({
        where: {
          gameId,
          OR: [
            { contractState: ContractState.FOR_SALE },
            { contractState: ContractState.QUEUED },
          ],
        },
      });
    if (!optionContracts) {
      throw new Error('Option contracts not found');
    }

    // Sort option contracts by tableau slot
    const sortedContracts = optionContracts.sort(
      (a, b) => (a.tableauSlot || 0) - (b.tableauSlot || 0),
    );

    // Find the index of the purchased contract
    const purchasedContractIndex = sortedContracts.findIndex(
      (contract) => contract.id === optionContract.id,
    );

    // Iterate through each contract in tableau and update slot, if it is queued, switch it to for sale
    const updatePromises = sortedContracts.map((contract, index) => {
      if (index < purchasedContractIndex) {
        return this.optionContractService.updateOptionContract({
          where: { id: contract.id },
          data: { tableauSlot: index },
        });
      } else if (index === purchasedContractIndex) {
        return this.optionContractService.updateOptionContract({
          where: { id: contract.id },
          data: { tableauSlot: null },
        });
      } else {
        return this.optionContractService.updateOptionContract({
          where: { id: contract.id },
          data: {
            tableauSlot: index - 1,
            contractState: ContractState.FOR_SALE,
          },
        });
      }
    });

    try {
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error cycling option contracts', error);
    }

    // Create a new contract for the queued slot
    try {
      await this.addNewQueuedOptionContract(gameId, companies);
    } catch (error) {
      console.error('Error adding new queued option contract', error);
    }
  }

  async resolvePendingShortOrders(phase: Phase) {
    if (phase.stockRoundId) {
      const shortOrders: PlayerOrderWithPlayerCompanySectorShortOrder[] =
        await this.prisma.playerOrder.findMany({
          where: {
            stockRoundId: phase.stockRoundId,
            orderStatus: OrderStatus.PENDING,
            orderType: OrderType.SHORT,
          },
          include: {
            Company: true,
            Player: true,
            Sector: true,
            ShortOrder: {
              include: {
                Share: true,
              },
            },
          },
        });
      if (!shortOrders) {
        throw new Error('Stock round not found');
      }
      shortOrders.forEach(async (order) => {
        //check if the short order has already been created
        if (!order.ShortOrder) {
          const shortInitialTotalValue =
            (order.quantity || 0) * (order.Company.currentStockPrice || 0);
          //see if the player has enough capital to create a margin account
          if (
            calculateMarginAccountMinimum(shortInitialTotalValue) >
            order.Player.cashOnHand
          ) {
            //reject order
            await this.prisma.playerOrder.update({
              where: { id: order.id },
              data: {
                orderStatus: OrderStatus.REJECTED,
              },
            });
            //game log
            await this.gameLogService.createGameLog({
              game: { connect: { id: order.gameId } },
              content: `Player ${order.Player.nickname} does not have enough cash to fund margin account to place short order`,
            });
          } else {
            //ensure there are enough shares to short
            const shares = await this.shareService.shares({
              where: {
                companyId: order.companyId,
                location: ShareLocation.OPEN_MARKET,
              },
            });
            if (!shares || shares.length < (order.quantity || 0)) {
              //reject order
              await this.prisma.playerOrder.update({
                where: { id: order.id },
                data: {
                  orderStatus: OrderStatus.REJECTED,
                },
              });

              //game log
              await this.gameLogService.createGameLog({
                game: { connect: { id: order.gameId } },
                content: `Player ${order.Player.nickname} does not have enough shares to place short order`,
              });
            } else {
              //check player margin account balance
              const player = order.Player;
              //get all player short orders and calculate margin account required total
              const playerShortOrdersOpen =
                await this.prisma.playerOrder.findMany({
                  where: {
                    playerId: player.id,
                    orderType: OrderType.SHORT,
                    orderStatus: OrderStatus.OPEN,
                  },
                  include: {
                    ShortOrder: true,
                  },
                });
              //add marginAccountMinimum together
              const marginAccountMinimumTotal = playerShortOrdersOpen.reduce(
                (acc, order) =>
                  acc + (order.ShortOrder?.marginAccountMinimum || 0),
                0,
              );
              const newShortOrderMarginAccountMinimum =
                calculateMarginAccountMinimum(shortInitialTotalValue);

              //create transaction
              this.transactionService.createTransactionEntityToEntity({
                fromEntityId: player.entityId || undefined,
                fromPlayerId: player.id,
                fromEntityType: EntityType.PLAYER,
                toEntityType: EntityType.PLAYER_MARGIN_ACCOUNT,
                toEntityId: MARGIN_ACCOUNT_ID_PREFIX + player.id,
                amount: newShortOrderMarginAccountMinimum,
                transactionType: TransactionType.CASH,
                gameId: order.gameId,
                gameTurnId: phase.gameTurnId,
                phaseId: phase.id,
                description: `Funding margin account for short order`,
              });
              await this.prisma.player.update({
                where: { id: player.id },
                data: {
                  cashOnHand: {
                    decrement: newShortOrderMarginAccountMinimum,
                  },
                  marginAccount: {
                    increment:
                      player.marginAccount ||
                      0 + newShortOrderMarginAccountMinimum,
                  },
                },
              });
              //game log
              await this.gameLogService.createGameLog({
                game: { connect: { id: order.gameId } },
                content: `Player ${order.Player.nickname} has funded their margin account with $${newShortOrderMarginAccountMinimum} to place a short order`,
              });

              //create the short order
              const shortOrder = await this.prisma.shortOrder.create({
                data: {
                  shortSalePrice: shortInitialTotalValue,
                  shortStockPriceAtPurchase:
                    order.Company.currentStockPrice || 0,
                  marginAccountMinimum: calculateMarginAccountMinimum(
                    shortInitialTotalValue,
                  ),
                  borrowRate: BORROW_RATE,
                  PlayerOrder: { connect: { id: order.id } },
                  Company: { connect: { id: order.companyId } },
                },
              });
              //give the player the money for the short
              this.playerAddMoney({
                gameId: order.gameId,
                gameTurnId: phase.gameTurnId,
                phaseId: phase.id,
                playerId: order.playerId,
                amount: shortInitialTotalValue,
                fromEntity: EntityType.BANK,
                description: `Short order against ${order.Company.name}`,
                transactionSubType: TransactionSubType.SHORT,
              });
              //game log
              await this.gameLogService.createGameLog({
                game: { connect: { id: order.gameId } },
                content: `Player ${order.Player.nickname} has placed a short order for ${order.quantity} shares of ${order.Company.name} and receives $${shortInitialTotalValue} in cash.`,
              });
              //update the player order status to opened
              await this.prisma.playerOrder.update({
                where: { id: order.id },
                data: {
                  orderStatus: OrderStatus.OPEN,
                  ShortOrder: { connect: { id: shortOrder.id } },
                },
              });
              //allocate the shares
              const shareIds = shares
                .slice(0, order.quantity || 0)
                .map((share) => {
                  return share.id;
                });
              //update the shares
              await this.shareService.updateManySharesUnchecked({
                where: { id: { in: shareIds } },
                data: {
                  playerId: order.playerId,
                  location: ShareLocation.PLAYER,
                  shortOrderId: shortOrder.id,
                },
              });
            }
          }
        }
      });
    }
  }

  async checkIfCompanyIsFloated(companyId: string) {
    //get company
    const company = await this.companyService.companyWithSharesAndSector({
      id: companyId,
    });
    if (!company) {
      throw new Error('Company not found');
    }
    if (company.status == CompanyStatus.INACTIVE) {
      //check if company has sold enough shares to float
      const totalShares = company.Share.length;
      const totalSharesInIpo = company.Share.filter(
        (share) => share.location === ShareLocation.IPO,
      ).length;
      //has the company got more than float of shares sold outside IPO?
      if (
        (totalShares - totalSharesInIpo) / totalShares >=
        company.Sector.sharePercentageToFloat / 100
      ) {
        //company is floated
        await this.companyService.updateCompany({
          where: { id: companyId },
          data: { status: CompanyStatus.ACTIVE, isFloated: true },
        });
      }
    }
  }

  async resolveMarketOrdersSingleOrderResolve(phase: Phase, game: Game) {
    const gameCache = this.gameCache.get(game.id);

    if (phase.stockRoundId && phase.stockSubRoundId) {
      const playerOrders =
        await this.playerOrderService.playerOrdersWithPlayerCompany({
          where: {
            stockRoundId: phase.stockRoundId,
            stockSubRoundId: phase.stockSubRoundId,
          },
        });
      if (!playerOrders) {
        throw new Error('Stock round not found');
      }

      let marketOrders = playerOrders.filter(
        (order) =>
          order.orderType === OrderType.MARKET &&
          order.orderStatus !== OrderStatus.FILLED,
      );

      const marketOrderIpoBuyOrders = marketOrders.filter(
        (order) => order.location == ShareLocation.IPO && !order.isSell,
      );
      const marketOrdersNoIpoBuyOrders = marketOrders.filter(
        (order) => !marketOrderIpoBuyOrders.includes(order),
      );

      const groupedMarketOrdersNoIpoBuyOrdersByCompany = this.groupByCompany(
        marketOrdersNoIpoBuyOrders,
      );

      const groupedMarketOrders = this.groupByCompany(marketOrders);

      try {
        await this.processMarketOrdersByCompany(
          groupedMarketOrders,
          game,
          phase,
        );
      } catch (error) {
        console.error('Error distributing shares:', error);
      }
      const players =
        gameCache?.players ??
        (await this.playersService.players({
          where: { gameId: phase.gameId },
        }));
      try {
        await Promise.all(
          players.map((player) =>
            this.playersService.updatePlayer({
              where: { id: player.id },
              data: { marketOrderActions: MAX_MARKET_ORDER_ACTIONS },
            }),
          ),
        );
      } catch (error) {
        console.error('Error setting market order actions:', error);
      }
      //get all orders for the current round that are FILLED and in the OPEN_MARKET,
      //when calculating net differences we should only take the net for successful orders.
      const openMarketOrders =
        await this.playerOrderService.playerOrdersWithPlayerCompany({
          where: {
            stockRoundId: phase.stockRoundId,
            stockSubRoundId: phase.stockSubRoundId,
            location: ShareLocation.OPEN_MARKET,
            orderStatus: OrderStatus.FILLED,
          },
        });

      //group these orders by company
      const groupedOpenMarketOrders = this.groupByCompany(openMarketOrders);

      const netDifferences = Object.entries(groupedOpenMarketOrders).map(
        ([companyId, orders]) => {
          const buys = orders.filter((order) => !order.isSell);
          const sells = orders.filter((order) => order.isSell);
          const buyQuantity = buys.reduce(
            (acc, order) => acc + (order.quantity || 0),
            0,
          );
          const sellQuantity = sells.reduce(
            (acc, order) => acc + (order.quantity || 0),
            0,
          );
          let netDifference = buyQuantity - sellQuantity;
          //if company has price freeze, the minimum net difference is 2
          if (
            orders[0].Company.CompanyActions.some(
              (action) => action.action === OperatingRoundAction.PRICE_FREEZE,
            )
          ) {
            netDifference = Math.min(netDifference, PRIZE_FREEZE_AMOUNT);
          }
          return {
            companyId,
            netDifference: buyQuantity - sellQuantity,
            orders,
          };
        },
      );
      try {
        await this.processNetDifferences(netDifferences, phase);
      } catch (error) {
        console.error('Error resolving netDifferences iteration:', error);
      }
    }
  }

  async resolveMarketOrders(phase: Phase) {
    const game = await this.gamesService.getGameState(phase.gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    if (phase.stockRoundId) {
      const playerOrders =
        await this.playerOrderService.playerOrdersWithPlayerCompany({
          where: { stockRoundId: phase.stockRoundId },
        });
      if (!playerOrders) {
        throw new Error('Stock round not found');
      }

      const groupedByPhase = this.groupByPhase(playerOrders);
      const sortedPhases = this.sortByPhaseCreationTimeAsc(groupedByPhase);
      for (const phaseOrders of sortedPhases) {
        const phaseId = phaseOrders[0].phaseId;
        const currentPhaseOrders = phaseOrders.filter(
          (order) => order.phaseId === phaseId,
        );
        let marketOrders = currentPhaseOrders.filter(
          (order) =>
            order.orderType === OrderType.MARKET &&
            order.orderStatus !== OrderStatus.FILLED,
        );

        const marketOrderIpoBuyOrders = marketOrders.filter(
          (order) => order.location == ShareLocation.IPO && !order.isSell,
        );
        const marketOrdersNoIpoBuyOrders = marketOrders.filter(
          (order) => !marketOrderIpoBuyOrders.includes(order),
        );

        const groupedMarketOrdersNoIpoBuyOrdersByCompany = this.groupByCompany(
          marketOrdersNoIpoBuyOrders,
        );

        const groupedMarketOrders = this.groupByCompany(marketOrders);

        try {
          await this.processMarketOrdersByCompany(
            groupedMarketOrders,
            game,
            phase,
          );
        } catch (error) {
          console.error('Error distributing shares:', error);
        }

        const players = await this.playersService.players({
          where: { gameId: phase.gameId },
        });
        try {
          await Promise.all(
            players.map((player) =>
              this.playersService.updatePlayer({
                where: { id: player.id },
                data: { marketOrderActions: MAX_MARKET_ORDER_ACTIONS },
              }),
            ),
          );
        } catch (error) {
          console.error('Error setting market order actions:', error);
        }
      }
      //get all orders for the current round that are FILLED and in the OPEN_MARKET,
      //when calculating net differences we should only take the net for successful orders.
      const openMarketOrders =
        await this.playerOrderService.playerOrdersWithPlayerCompany({
          where: {
            stockRoundId: phase.stockRoundId,
            location: ShareLocation.OPEN_MARKET,
            orderStatus: OrderStatus.FILLED,
          },
        });

      //group these orders by company
      const groupedOpenMarketOrders = this.groupByCompany(openMarketOrders);

      const netDifferences = Object.entries(groupedOpenMarketOrders).map(
        ([companyId, orders]) => {
          const buys = orders.filter((order) => !order.isSell);
          const sells = orders.filter((order) => order.isSell);
          const buyQuantity = buys.reduce(
            (acc, order) => acc + (order.quantity || 0),
            0,
          );
          const sellQuantity = sells.reduce(
            (acc, order) => acc + (order.quantity || 0),
            0,
          );
          let netDifference = buyQuantity - sellQuantity;
          //if company has price freeze, the minimum net difference is 2
          if (
            orders[0].Company.CompanyActions.some(
              (action) => action.action === OperatingRoundAction.PRICE_FREEZE,
            )
          ) {
            netDifference = Math.min(netDifference, PRIZE_FREEZE_AMOUNT);
          }
          return {
            companyId,
            netDifference: buyQuantity - sellQuantity,
            orders,
          };
        },
      );
      try {
        await this.processNetDifferences(netDifferences, phase);
      } catch (error) {
        console.error('Error resolving netDifferences iteration:', error);
      }
    }
  }

  async processNetDifferences(netDifferences: any[], phase: Phase) {
    await Promise.all(
      netDifferences.map(async ({ companyId, netDifference, orders }) => {
        let currentTier = orders[0].Company.stockTier;
        let currentTierSize = stockTierChartRanges.find(
          (range) => range.tier === currentTier,
        );

        const { steps, newTierSharesFulfilled, newTier, newSharePrice } =
          calculateStepsAndRemainder(
            netDifference,
            orders[0].Company.tierSharesFulfilled,
            currentTierSize?.fillSize ?? 0,
            orders[0].Company.currentStockPrice ?? 0,
          );

        if (netDifference > 0) {
          await this.companyService.updateCompany({
            where: { id: companyId },
            data: {
              tierSharesFulfilled: newTierSharesFulfilled,
              stockTier: newTier,
            },
          });
          const newStockPrice = await this.stockHistoryService.moveStockPriceUp(
            orders[0].gameId,
            companyId,
            phase.id,
            orders[0].Company.currentStockPrice || 0,
            steps,
            StockAction.MARKET_BUY,
          );
          await this.gameLogService.createGameLog({
            game: { connect: { id: orders[0].gameId } },
            content: `Stock price for ${orders[0].Company.name} has increased to $${newStockPrice.price} due to market buy orders`,
          });
          await this.playerOrderService.triggerLimitOrdersFilled(
            orders[0].Company.currentStockPrice || 0,
            newStockPrice.price,
            companyId,
          );
        } else if (netDifference < 0) {
          const stockPrice = await this.stockHistoryService.moveStockPriceDown(
            orders[0].gameId,
            companyId,
            phase.id,
            orders[0].Company.currentStockPrice || 0,
            netDifference,
            StockAction.MARKET_SELL,
          );
          await this.gameLogService.createGameLog({
            game: { connect: { id: orders[0].gameId } },
            content: `Stock price for ${orders[0].Company.name} has decreased to $${stockPrice.price} by ${netDifference} steps due to market sell orders`,
          });
          await this.playerOrderService.triggerLimitOrdersFilled(
            orders[0].Company.currentStockPrice || 0,
            stockPrice.price,
            companyId,
          );
          await this.companyService.updateCompany({
            where: { id: companyId },
            data: {
              stockTier: getCurrentTierBySharePrice(stockPrice.price),
            },
          });
        }
      }),
    );
  }
  //TODO: Orders should be processed in player priority order for priority strategy, regardless of order type.
  async processMarketOrdersByCompany(
    groupedMarketOrders: Record<string, PlayerOrderWithPlayerCompany[]>,
    game: Game,
    phase: Phase,
  ) {
    // CRITICAL: Process companies sequentially (not in parallel) to ensure proper cash validation
    // When processing in parallel, each company fetches fresh player data independently,
    // which can allow total deductions across companies to exceed available cash.
    // By processing sequentially, each company sees the updated cash from previous companies.
    for (const [companyId, orders] of Object.entries(groupedMarketOrders)) {
      // Process sell orders first (they don't affect cash for buy orders)
      await Promise.all(
        orders.map(async (order) => {
          if (order.isSell) {
            await this.resolveSellOrder(order, companyId);
          }
        }),
      );

      const buyOrdersIPO = orders.filter(
        (order) => !order.isSell && order.location == ShareLocation.IPO,
      );
      if (buyOrdersIPO.length > 0) {
        if (
          game.distributionStrategy === DistributionStrategy.BID_PRIORITY ||
          game.distributionStrategy === DistributionStrategy.PRIORITY
        ) {
          await this.distributeSharesStrategy(
            buyOrdersIPO,
            ShareLocation.IPO,
            companyId,
            this.shareService,
            game,
            this.prisma,
            game.distributionStrategy,
            phase,
          );
        } else {
          await this.distributeShares(
            buyOrdersIPO,
            ShareLocation.IPO,
            companyId,
            this.shareService,
            this.prisma,
          );
        }
        await this.checkIfCompanyIsFloated(companyId);
      }
      const buyOrdersOM = orders.filter(
        (order) =>
          !order.isSell && order.location == ShareLocation.OPEN_MARKET,
      );
      if (buyOrdersOM.length > 0) {
        if (
          game.distributionStrategy === DistributionStrategy.BID_PRIORITY ||
          game.distributionStrategy === DistributionStrategy.PRIORITY
        ) {
          await this.distributeSharesStrategy(
            buyOrdersOM,
            ShareLocation.OPEN_MARKET,
            companyId,
            this.shareService,
            game,
            this.prisma,
            game.distributionStrategy,
            phase,
          );
        } else {
          await this.distributeShares(
            buyOrdersOM,
            ShareLocation.OPEN_MARKET,
            companyId,
            this.shareService,
            this.prisma,
          );
        }
      }
    }
  }

  async setIpoPriceAndCreateSharesAndInjectCapital(
    ipoPrice: number,
    company: CompanyWithSector,
    gameId: string,
  ) {
    const sector = company.Sector;
    if (!sector) {
      throw new Error('Sector not found');
    }
    if (ipoPrice < sector.ipoMin || ipoPrice > sector.ipoMax) {
      throw new Error('IPO price is not within sector range');
    }
    //ensure the price exists on the stockPricesGrid
    if (!stockGridPrices.includes(ipoPrice)) {
      throw new Error('IPO price is not a valid stock price');
    }
    //set the ipo price, current price of the company and it's cash on hand
    const companyUpdated = await this.companyService.updateCompany({
      where: { id: company.id },
      data: {
        ipoAndFloatPrice: ipoPrice,
        currentStockPrice: ipoPrice,
        cashOnHand: ipoPrice * DEFAULT_SHARE_DISTRIBUTION,
        stockTier: determineStockTier(ipoPrice),
      },
    });
    //create shares
    //iterate through companies and create ipo shares
    const shares: {
      companyId: string;
      price: number;
      location: ShareLocation;
      gameId: string;
    }[] = [];
    for (let i = 0; i < DEFAULT_SHARE_DISTRIBUTION; i++) {
      shares.push({
        price: ipoPrice,
        location: ShareLocation.IPO,
        companyId: company.id,
        gameId,
      });
    }
    await this.shareService.createManyShares(shares);
    return companyUpdated;
  }

  async resolveSellOrder(
    order: PlayerOrderWithPlayerCompany,
    companyId: string,
  ) {
    const sellAmount = order.quantity || 0;
    const sharePrice = order.Company.currentStockPrice || 0;
    const playerActualSharesOwned = await this.shareService.shares({
      where: {
        playerId: order.playerId,
        companyId,
        location: ShareLocation.PLAYER,
        isCommitted: false, // Cannot sell committed shares
      },
    });
    if (playerActualSharesOwned.length < order.quantity!) {
      // Check if player has shares but they're committed
      const allPlayerShares = await this.shareService.shares({
        where: {
          playerId: order.playerId,
          companyId,
          location: ShareLocation.PLAYER,
        },
      });
      const committedShares = allPlayerShares.filter((s) => s.isCommitted).length;
      
      //reject the order
      await this.prisma.playerOrder.update({
        where: { id: order.id },
        data: {
          orderStatus: OrderStatus.REJECTED,
        },
      });
      //game log
      const errorMessage = committedShares > 0
        ? `Player ${order.Player.nickname} does not have enough uncommitted shares to sell (${committedShares} shares are committed to forecast quarters)`
        : `Player ${order.Player.nickname} does not have enough shares to sell`;
      await this.gameLogService.createGameLog({
        game: { connect: { id: order.gameId } },
        content: errorMessage,
      });
      //throw
      throw new Error(errorMessage);
    }
    const sharesToSell = Math.min(playerActualSharesOwned.length, sellAmount);
    try {
      await this.playerAddMoney({
        gameId: order.gameId,
        gameTurnId: order.gameTurnCreated,
        phaseId: order.phaseId,
        playerId: order.playerId,
        amount: sharesToSell * sharePrice,
        fromEntity: EntityType.BANK,
        description: `Player ${order.Player.nickname} has sold ${sharesToSell} shares of ${order.Company.name} at $${sharePrice}`,
        transactionSubType: TransactionSubType.MARKET_SELL,
      });
      await this.gameLogService.createGameLog({
        game: { connect: { id: order.gameId } },
        content: `Player ${
          order.Player.nickname
        } has sold ${sharesToSell} shares of ${
          order.Company.name
        } at $${sharePrice.toFixed(2)}`,
      });
    } catch (error) {
      console.error('Error selling shares:', error);
    }

    let sharesToUpdate;
    try {
      sharesToUpdate = await this.prisma.share.findMany({
        where: {
          playerId: order.playerId,
          companyId,
          location: ShareLocation.PLAYER,
          isCommitted: false, // Cannot sell committed shares
        },
        take: sellAmount,
      });
      const shareIds = sharesToUpdate.map((share) => share.id);
      await this.shareService.updateManySharesUnchecked({
        where: { id: { in: shareIds } },
        data: {
          playerId: null,
          location: ShareLocation.OPEN_MARKET,
        },
      });
      await this.prisma.playerOrder.update({
        where: { id: order.id },
        data: { orderStatus: OrderStatus.FILLED },
      });
    } catch (error) {
      console.error('Error updating shares:', error);
    }
  }
  sortByBidValue(
    buyOrders: PlayerOrderWithPlayerCompany[],
    playerPriorities: Record<string, number>,
  ) {
    return buyOrders.sort((a, b) => {
      const valueDifference = (b.value || 0) - (a.value || 0);
      if (valueDifference !== 0) return valueDifference;

      const priorityA = playerPriorities[a.playerId] || Infinity;
      const priorityB = playerPriorities[b.playerId] || Infinity;
      return priorityA - priorityB;
    });
  }

  sortByPlayerPriority(
    buyOrders: PlayerOrderWithPlayerCompany[],
    playerPriorities: Record<string, number>,
  ) {
    return buyOrders.sort((a, b) => {
      const priorityA = playerPriorities[a.playerId] || Infinity;
      const priorityB = playerPriorities[b.playerId] || Infinity;
      return priorityA - priorityB;
    });
  }

  private getCurrentShareOrderFilledTotalPlayer(shareUpdates: any[]): number {
    return shareUpdates.reduce((acc, update) => {
      //if shares are coming into the player portfolio, we increase the total
      if (update.data.location === ShareLocation.PLAYER) {
        return acc + 1;
      }
      //if previous orders have placed orders into open market, we reduce the total
      if (update.data.location === ShareLocation.OPEN_MARKET) {
        return acc - 1;
      }
      return acc;
    }, 0);
  }
  private processBidOrdersBidStrategy(
    sortedOrders: PlayerOrderWithPlayerCompany[],
    remainingShares: number,
    allAvailableShares: Share[],
    currentShareIndex: number,
    shareUpdates: ShareUpdate[],
    playerCashUpdates: { playerId: string; decrement: number }[],
    orderStatusUpdates: any[],
    gameLogEntries: any[],
    playersWithShares: PlayerWithShares[], //we need this reference because we are now actively checking stock ownership and cash on hand
  ): { currentShareIndex: number; remainingShares: number; oversoldShares: number; oversoldShareCreations: Array<{ companyId: string; gameId: string; price: number; location: ShareLocation; playerId: string; quantity: number }> } {
    // CRITICAL: Track pending cash decrements per player to prevent over-spending
    const pendingCashDecrements = new Map<string, number>();
    let oversoldShares = 0;
    const oversoldShareCreations: Array<{ companyId: string; gameId: string; price: number; location: ShareLocation; playerId: string; quantity: number }> = [];
    
    for (const order of sortedOrders) {
      // Allow orders even when remainingShares <= 0 (oversold scenario)
      // We still need to check other constraints like ownership percentage and cash
      {
        //TODO: I don't think we need this since we're updating shares per phase now
        // const shareUpdatesForPlayerAndCompany = shareUpdates.filter(
        //   (update) =>
        //     update.data.playerId === order.playerId &&
        //     update.companyId === order.companyId,
        // );
        //const player share total
        const player = playersWithShares.find(
          (player) => player.id == order.Player.id,
        );
        if (!player) {
          throw new Error(`Player from player order id:${order.id} not found.`);
        }

        const playerSharesForOrderCompany = player.Share.filter(
          (share) =>
            share.companyId === order.companyId &&
            share.location === ShareLocation.PLAYER,
        );
        if (
          (order?.quantity || 0) + playerSharesForOrderCompany.length >
          (MAX_SHARE_PERCENTAGE * order.Company.Share.length) / 100
        ) {
          orderStatusUpdates.push({
            where: { id: order.id },
            data: { orderStatus: OrderStatus.REJECTED },
          });
          gameLogEntries.push({
            game: { connect: { id: order.gameId } },
            content: `Player ${order.Player.nickname} has exceeded the maximum share percentage of ${MAX_SHARE_PERCENTAGE}% for ${order.Company.name}`,
          });
        } else {
          // Calculate order cost
          const orderCost = (order.value || 0) * (order.quantity || 0);
          // Get current pending decrements for this player (from previous orders in this batch)
          const currentPendingDecrement = pendingCashDecrements.get(order.playerId) || 0;
          // Check if player has enough cash AFTER accounting for pending decrements
          if (
            player.cashOnHand < orderCost + currentPendingDecrement
          ) {
            orderStatusUpdates.push({
              where: { id: order.id },
              data: { orderStatus: OrderStatus.REJECTED },
            });
            gameLogEntries.push({
              game: { connect: { id: order.gameId } },
              content: `Player ${order.Player.nickname} does not have enough cash to purchase ${order.quantity} shares of ${order.Company.name} at $${order.value}`,
            });
          } else {
            const sharesToGive = order.quantity || 0;
            const sharesAvailable = Math.min(sharesToGive, remainingShares);
            const oversoldForThisOrder = Math.max(0, sharesToGive - remainingShares);
            
            // Process available shares first
            if (sharesAvailable > 0 && currentShareIndex < allAvailableShares.length) {
              const shares = allAvailableShares.slice(
                currentShareIndex,
                currentShareIndex + sharesAvailable,
              );
              currentShareIndex += sharesAvailable;
              shareUpdates.push({
                companyId: order.companyId,
                where: { id: { in: shares.map((share) => share.id) } },
                data: {
                  location: ShareLocation.PLAYER,
                  playerId: order.playerId,
                },
              });
              remainingShares -= sharesAvailable;
            }
            
            // Handle oversold shares - track them for later creation
            if (oversoldForThisOrder > 0) {
              oversoldShares += oversoldForThisOrder;
              
              // Track oversold share creation per player
              oversoldShareCreations.push({
                companyId: order.companyId,
                gameId: order.gameId,
                price: order.value || order.Company.currentStockPrice || 0,
                location: order.location,
                playerId: order.playerId,
                quantity: oversoldForThisOrder,
              });
            }

            // Process all shares (available + oversold) for cash and order status
            const cashDecrement = sharesToGive * order.value!;
            playerCashUpdates.push({
              playerId: order.playerId,
              decrement: cashDecrement,
            });
            
            // Track pending decrement for this player to validate subsequent orders
            pendingCashDecrements.set(
              order.playerId,
              (pendingCashDecrements.get(order.playerId) || 0) + cashDecrement
            );

            orderStatusUpdates.push({
              where: { id: order.id },
              data: { orderStatus: OrderStatus.FILLED },
            });

            const oversoldMessage = oversoldForThisOrder > 0 
              ? ` (${oversoldForThisOrder} shares oversold)`
              : '';
            gameLogEntries.push({
              game: { connect: { id: order.gameId } },
              content: `Player ${order.Player.nickname} has bought ${sharesToGive} shares of ${order.Company.name} at $${order.value}${oversoldMessage}`,
            });
          }
        }
      }
    }
    return { currentShareIndex, remainingShares, oversoldShares, oversoldShareCreations };
  }

  private processOrdersPriorityStrategy(
    sortedOrders: PlayerOrderWithPlayerCompany[],
    remainingShares: number,
    allAvailableShares: Share[],
    currentShareIndex: number,
    shareUpdates: ShareUpdate[],
    playerCashUpdates: { playerId: string; decrement: number }[],
    orderStatusUpdates: any[],
    gameLogEntries: any[],
    playersWithShares: PlayerWithShares[], //we need this reference because we are now actively checking stock ownership and cash on hand
  ): { currentShareIndex: number; remainingShares: number } {
    // TODO: Implement priority-based order processing strategy
    return { currentShareIndex, remainingShares };
  }

  private async fetchPlayerPriorities(playerIds: string[]) {
    const playerPriorities =
      await this.playerPriorityService.listPlayerPriorities({
        where: {
          playerId: { in: playerIds },
        },
      });

    return playerPriorities.reduce<Record<string, number>>((acc, priority) => {
      acc[priority.playerId] = priority.priority;
      return acc;
    }, {});
  }

  async distributeSharesStrategy(
    phaseOrders: PlayerOrderWithPlayerCompany[],
    location: ShareLocation,
    companyId: string,
    shareService: ShareService,
    game: Game,
    prisma: any,
    strategy: DistributionStrategy,
    phase?: Phase,
  ) {
    let currentShareIndex = 0;

    const shareUpdates: ShareUpdate[] = [];
    const playerCashUpdates: { playerId: string; decrement: number }[] = [];
    const orderStatusUpdates: any[] = [];
    const gameLogEntries: any[] = [];

    const company = phaseOrders[0].Company;
    const totalCompanyShares = company.Share.length;
    const maxSharesPerPlayer =
      totalCompanyShares * (MAX_SHARE_PERCENTAGE / 100);

    const playerShares: Record<string, number> = {};
    for (const share of company.Share) {
      if (share.location === ShareLocation.PLAYER && share.playerId) {
        if (!playerShares[share.playerId]) {
          playerShares[share.playerId] = 0;
        }
        playerShares[share.playerId] += 1;
      }
    }

    const totalBuyOrderShares = phaseOrders.reduce(
      (acc, order) => acc + (order.quantity || 0),
      0,
    );
    let remainingShares = Math.min(
      company.Share.filter((share) => share.location == location).length,
      totalBuyOrderShares,
    );

    const allAvailableShares = await shareService.shares({
      where: { companyId, location },
      take: remainingShares,
    });

    const playerIds = phaseOrders.map((order) => order.playerId);
    const playerPriorities = await this.fetchPlayerPriorities(
      playerIds,
    );
    let sortedOrders: PlayerOrderWithPlayerCompany[] | undefined;
    if (strategy === DistributionStrategy.BID_PRIORITY) {
      const sortedByBidValue = this.sortByBidValue(
        phaseOrders,
        playerPriorities,
      );
      sortedOrders = sortedByBidValue;
    }
    if (strategy === DistributionStrategy.PRIORITY) {
      const sortedByPlayerPriority = this.sortByPlayerPriority(
        phaseOrders,
        playerPriorities,
      );
      sortedOrders = sortedByPlayerPriority;
    }
    if (!sortedOrders) {
      throw new Error('Strategy not found');
    }
    const playersWithShares = await this.playersService.playersWithShares({
      gameId: game.id,
      id: { in: playerIds },
    });
    const {
      currentShareIndex: _currentShareIndex,
      remainingShares: _remainingShares,
      oversoldShares: _oversoldShares,
      oversoldShareCreations: _oversoldShareCreations,
    } = this.processBidOrdersBidStrategy(
      sortedOrders,
      remainingShares,
      allAvailableShares,
      currentShareIndex,
      shareUpdates,
      playerCashUpdates,
      orderStatusUpdates,
      gameLogEntries,
      playersWithShares,
    );
    currentShareIndex = _currentShareIndex;
    remainingShares = _remainingShares;
    
    // Create oversold shares and assign them directly to players
    if (_oversoldShares > 0 && _oversoldShareCreations.length > 0) {
      const oversoldSharesToCreate: Array<{
        price: number;
        location: ShareLocation;
        companyId: string;
        gameId: string;
        playerId: string;
      }> = [];
      
      // Group oversold shares by company to track total oversold per company
      const oversoldByCompany = new Map<string, number>();
      
      for (const oversold of _oversoldShareCreations) {
        for (let i = 0; i < oversold.quantity; i++) {
          oversoldSharesToCreate.push({
            price: oversold.price,
            location: ShareLocation.PLAYER, // Oversold shares go directly to players
            companyId: oversold.companyId,
            gameId: oversold.gameId,
            playerId: oversold.playerId,
          });
        }
        
        // Track total oversold per company
        const currentOversold = oversoldByCompany.get(oversold.companyId) || 0;
        oversoldByCompany.set(oversold.companyId, currentOversold + oversold.quantity);
      }
      
      if (oversoldSharesToCreate.length > 0) {
        await this.shareService.createManyShares(oversoldSharesToCreate);
        
        // Update company oversoldShares and adjust market cap
        for (const [companyId, oversoldAmount] of oversoldByCompany.entries()) {
          const company = phaseOrders[0].Company;
          if (company.id === companyId) {
            // Get current phase for stock price adjustment
            const currentPhase = phase || await this.phaseService.phase({
              id: game.currentPhaseId || '',
            });
            
            if (currentPhase) {
              // Get current company state to check existing oversold
              const currentCompany = await this.companyService.company({
                id: companyId,
              });
              
              if (currentCompany) {
                const previousOversold = currentCompany.oversoldShares || 0;
                const newOversoldTotal = previousOversold + oversoldAmount;
                
                // Update company's oversold shares (add to existing)
                const updatedCompany = await this.companyService.updateCompany({
                  where: { id: companyId },
                  data: {
                    oversoldShares: newOversoldTotal,
                  },
                });
                
                // Adjust market cap by moving stock price down (left) by the NEW oversold amount
                // Only move if there's an increase in oversold
                if (updatedCompany.currentStockPrice && oversoldAmount > 0) {
                  await this.stockHistoryService.moveStockPriceDown(
                    game.id,
                    companyId,
                    currentPhase.id,
                    updatedCompany.currentStockPrice,
                    oversoldAmount,
                    StockAction.MARKET_BUY, // Using MARKET_BUY as the action type for oversold
                  );
                  
                  // Add game log entry
                  gameLogEntries.push({
                    game: { connect: { id: game.id } },
                    content: `${company.name} is oversold by ${oversoldAmount} shares (total: ${newOversoldTotal}). Market cap adjusted down by ${oversoldAmount} steps.`,
                  });
                }
              }
            }
          }
        }
      }
    }

    const _shareUpdates = shareUpdates.map((update) => {
      const { companyId, ...rest } = update;
      return rest;
    });
    await this.executeDatabaseOperations(
      prisma,
      _shareUpdates,
      playerCashUpdates,
      orderStatusUpdates,
      gameLogEntries,
      game.id,
      game.currentTurn || '',
      game.currentPhaseId || '',
    );
  }

  /**
   * Distributes shares among players based on their buy orders and the current phase.
   *
   * Priority Order for Distributing Shares:
   * 1. **Phases Sorted by Creation Time**: Shares are distributed based on the order of phase creation time, with earlier phases having higher priority.
   * 2. **Within Each Phase**:
   *    - **Proportional Distribution**: If total requested shares exceed remaining shares, shares are distributed proportionally based on the number of buyers.
   *    - **Random Allocation (Lottery)**: If there are remaining shares after proportional distribution, they are allocated randomly among the remaining orders.
   *    - **Direct Fulfillment**: If total requested shares do not exceed remaining shares, all requested shares are fulfilled directly.
   *
   * @param buyOrders - Array of player orders with player and company details.
   * @param location - The location from where the shares are to be distributed.
   * @param companyId - The ID of the company whose shares are being distributed.
   * @param shareService - Service to handle share-related operations.
   */
  async distributeShares(
    phaseOrders: PlayerOrderWithPlayerCompany[],
    location: ShareLocation,
    companyId: string,
    shareService: ShareService,
    prisma: any,
  ) {
    let currentShareIndex = 0;

    const shareUpdates: any[] = [];
    const playerCashUpdates: { playerId: string; decrement: number }[] = [];
    const orderStatusUpdates: any[] = [];
    const gameLogEntries: any[] = [];

    const company = phaseOrders[0].Company;
    const totalCompanyShares = company.Share.length;
    const maxSharesPerPlayer =
      totalCompanyShares * (MAX_SHARE_PERCENTAGE / 100);

    const playerShares: Record<string, number> = {};
    for (const share of company.Share) {
      if (share.location === ShareLocation.PLAYER && share.playerId) {
        if (!playerShares[share.playerId]) {
          playerShares[share.playerId] = 0;
        }
        playerShares[share.playerId] += 1;
      }
    }

    const playerOrderQuantities: Record<string, number> = {};
    const validBuyOrders = this.filterValidBuyOrders(
      phaseOrders,
      playerShares,
      playerOrderQuantities,
      maxSharesPerPlayer,
      orderStatusUpdates,
    );

    const totalBuyOrderShares = validBuyOrders.reduce(
      (acc, order) => acc + (order.quantity || 0),
      0,
    );
    let remainingShares = Math.min(
      company.Share.filter((share) => share.location == location).length,
      totalBuyOrderShares,
    );

    const allAvailableShares = await shareService.shares({
      where: { companyId, location },
      take: remainingShares,
    });

    // Note: Cash validation happens in executeDatabaseOperations, which aggregates
    // all cash updates per player and validates against fresh database data.
    // Since processMarketOrdersByCompany now processes companies sequentially,
    // each company will see updated cash from previous companies.
    this.distributeWithinPhase(
      validBuyOrders,
      allAvailableShares,
      remainingShares,
      currentShareIndex,
      shareUpdates,
      playerCashUpdates,
      orderStatusUpdates,
      gameLogEntries,
    );

    const _shareUpdates = shareUpdates.map((update) => {
      const { companyId, ...rest } = update;
      return rest;
    });

    await this.executeDatabaseOperations(
      prisma,
      _shareUpdates,
      playerCashUpdates,
      orderStatusUpdates,
      gameLogEntries,
      phaseOrders?.[0].gameId || '',
      phaseOrders?.[0].gameTurnCreated || '',
      phaseOrders?.[0].phaseId || '',
    );
  }

  private distributeWithinPhase(
    validBuyOrders: PlayerOrderWithPlayerCompany[],
    allAvailableShares: Share[],
    remainingShares: number,
    currentShareIndex: number,
    shareUpdates: any[],
    playerCashUpdates: { playerId: string; decrement: number }[],
    orderStatusUpdates: any[],
    gameLogEntries: any[],
  ) {
    // CRITICAL: Track pending cash decrements per player to validate during processing
    // This ensures we catch over-spending even within a single phase before executeDatabaseOperations
    const pendingCashDecrements = new Map<string, number>();
    
    for (const order of validBuyOrders) {
      if (remainingShares <= 0) break;

      const sharesToAllocate = Math.min(order.quantity || 0, remainingShares);
      const totalCostForThisOrder = sharesToAllocate * (order.value || allAvailableShares[currentShareIndex]?.price || 0);
      
      // Get current pending decrements for this player (from previous orders in this batch)
      const currentPendingDecrement = pendingCashDecrements.get(order.playerId) || 0;
      
      // Note: We can't validate cash here because we don't have player data
      // Validation will happen in executeDatabaseOperations, which aggregates all decrements
      // and validates against fresh player data from the database
      
      for (let i = 0; i < sharesToAllocate; i++) {
        const share = allAvailableShares[currentShareIndex];
        shareUpdates.push({
          ...share,
          playerId: order.playerId,
          location: ShareLocation.PLAYER,
        });

        const sharePrice = share?.price || 0;
        playerCashUpdates.push({
          playerId: order.playerId,
          decrement: sharePrice,
        });
        
        // Track pending decrement for this player
        pendingCashDecrements.set(
          order.playerId,
          (pendingCashDecrements.get(order.playerId) || 0) + sharePrice
        );

        currentShareIndex++;
        remainingShares--;
      }

      orderStatusUpdates.push({
        orderId: order.id,
        status: OrderStatus.FILLED,
      });

      gameLogEntries.push({
        content: `Player ${order.Player.nickname} bought ${sharesToAllocate} shares of ${order.Company.name}.`,
      });
    }
  }

  filterValidBuyOrders(
    buyOrders: PlayerOrderWithPlayerCompany[],
    playerShares: Record<string, number>,
    playerOrderQuantities: Record<string, number>,
    maxSharesPerPlayer: number,
    orderStatusUpdates: any[],
  ) {
    return buyOrders.filter((order) => {
      const currentShares = playerShares[order.playerId] || 0;
      const placedOrderQuantity = playerOrderQuantities[order.playerId] || 0;
      const newTotalShares =
        currentShares + placedOrderQuantity + (order.quantity || 0);

      if (newTotalShares > maxSharesPerPlayer) {
        orderStatusUpdates.push({
          where: { id: order.id },
          data: { orderStatus: OrderStatus.REJECTED },
        });
        return false;
      }

      playerOrderQuantities[order.playerId] =
        placedOrderQuantity + (order.quantity || 0);
      return true;
    });
  }

  // Utility function to group orders by phaseId
  groupByPhase(
    orders: PlayerOrderWithPlayerCompany[],
  ): Record<string, PlayerOrderWithPlayerCompany[]> {
    return orders.reduce(
      (acc, order) => {
        if (!acc[order.phaseId]) {
          acc[order.phaseId] = [];
        }
        acc[order.phaseId].push(order);
        return acc;
      },
      {} as Record<string, PlayerOrderWithPlayerCompany[]>,
    );
  }

  groupByCompany(
    orders: PlayerOrderWithPlayerCompany[],
  ): Record<string, PlayerOrderWithPlayerCompany[]> {
    return orders.reduce(
      (acc, order) => {
        if (!acc[order.companyId]) {
          acc[order.companyId] = [];
        }
        acc[order.companyId].push(order);
        return acc;
      },
      {} as Record<string, PlayerOrderWithPlayerCompany[]>,
    );
  }

  // Utility function to sort phases by creation time
  sortByPhaseCreationTimeAsc(
    phases: Record<string, PlayerOrderWithPlayerCompany[]>,
  ): PlayerOrderWithPlayerCompany[][] {
    return Object.values(phases).sort(
      (a, b) =>
        new Date(a[0].createdAt).getTime() - new Date(b[0].createdAt).getTime(),
    );
  }

  /**
   * Divides shares proportionally for fair split strategy
   *
   * @param orders
   * @param remainingShares
   * @param allAvailableShares
   * @param currentShareIndex
   * @param shareUpdates
   * @param playerCashUpdates
   * @param orderStatusUpdates
   * @param gameLogEntries
   * @returns
   */
  proportionalDistribution(
    orders: PlayerOrderWithPlayerCompany[],
    remainingShares: number,
    allAvailableShares: Share[],
    currentShareIndex: number,
    shareUpdates: any[],
    playerCashUpdates: { playerId: string; decrement: number }[],
    orderStatusUpdates: any[],
    gameLogEntries: any[],
  ) {
    //group orders by player id
    const ordersGroupedByPlayer = orders.reduce<{
      [key: string]: PlayerOrderWithPlayerCompany[];
    }>((acc, order) => {
      if (!acc[order.playerId]) {
        acc[order.playerId] = [];
      }
      acc[order.playerId].push(order);
      return acc;
    }, {});
    const numBuyers = Object.values(ordersGroupedByPlayer).length;
    const sharesPerBuyer = Math.floor(remainingShares / numBuyers);
    for (const order of Object.values(ordersGroupedByPlayer)) {
      //get total order quantity for shares of player
      let totalOrderQuantity = 0;
      for (const o of order) {
        totalOrderQuantity += o.quantity || 0;
      }
      const sharesToDistribute = Math.min(
        sharesPerBuyer,
        totalOrderQuantity || 0,
      );
      if (sharesToDistribute <= 0) continue;

      const shares = allAvailableShares.slice(
        currentShareIndex,
        currentShareIndex + sharesToDistribute,
      );
      currentShareIndex += sharesToDistribute;

      shareUpdates.push({
        companyId: order[0].companyId,
        where: { id: { in: shares.map((share) => share.id) } },
        data: {
          location: ShareLocation.PLAYER,
          playerId: order[0].playerId,
        },
      });

      playerCashUpdates.push({
        playerId: order[0].playerId,
        decrement: sharesToDistribute * order[0].Company.currentStockPrice!,
      });

      for (const o of order) {
        orderStatusUpdates.push({
          where: { id: o.id },
          data: { orderStatus: OrderStatus.FILLED },
        });
      }

      gameLogEntries.push({
        game: { connect: { id: order[0].gameId } },
        content: `Player ${
          order[0].Player.nickname
        } has bought ${sharesToDistribute} shares of ${
          order[0].Company.name
        } at $${order[0].Company.currentStockPrice?.toFixed(2)}`,
      });

      remainingShares -= sharesToDistribute;
    }

    return sharesPerBuyer;
  }

  lotteryAllocation(
    orders: PlayerOrderWithPlayerCompany[],
    remainingShares: number,
    sharesPerBuyer: number,
    allAvailableShares: Share[],
    currentShareIndex: number,
    shareUpdates: any[],
    playerCashUpdates: { playerId: string; decrement: number }[],
    orderStatusUpdates: any[],
    gameLogEntries: any[],
  ) {
    const remainingGroupedOrders = orders.filter(
      (order) => (order.quantity || 0) > sharesPerBuyer,
    );

    while (remainingShares > 0 && remainingGroupedOrders.length > 0) {
      const randomIndex = Math.floor(
        Math.random() * remainingGroupedOrders.length,
      );
      const order = remainingGroupedOrders[randomIndex];

      const shares = allAvailableShares.slice(
        currentShareIndex,
        currentShareIndex + 1,
      );
      currentShareIndex += 1;

      shareUpdates.push({
        companyId: order.companyId,
        where: { id: { in: [shares[0].id] } },
        data: {
          location: ShareLocation.PLAYER,
          playerId: order.playerId,
        },
      });

      playerCashUpdates.push({
        playerId: order.playerId,
        decrement: order.Company.currentStockPrice!,
      });

      orderStatusUpdates.push({
        where: { id: order.id },
        data: { orderStatus: OrderStatus.FILLED },
      });

      gameLogEntries.push({
        game: { connect: { id: order.gameId } },
        content: `Player ${
          order.Player.nickname
        } has won a lottery for a share of ${
          order.Company.name
        } at $${order.Company.currentStockPrice?.toFixed(2)}`,
      });

      remainingShares -= 1;
      remainingGroupedOrders[randomIndex].quantity! -= 1;
      if (remainingGroupedOrders[randomIndex].quantity! <= 0) {
        remainingGroupedOrders.splice(randomIndex, 1);
      }
    }

    remainingGroupedOrders.forEach((order) => {
      orderStatusUpdates.push({
        where: { id: order.id },
        data: { orderStatus: OrderStatus.REJECTED },
      });
    });
  }

  directFulfillment(
    orders: PlayerOrderWithPlayerCompany[],
    remainingShares: number,
    allAvailableShares: Share[],
    currentShareIndex: number,
    shareUpdates: any[],
    playerCashUpdates: { playerId: string; decrement: number }[],
    orderStatusUpdates: any[],
    gameLogEntries: any[],
  ) {
    for (const order of orders) {
      const sharesToGive = Math.min(order.quantity || 0, remainingShares);

      const shares = allAvailableShares.slice(
        currentShareIndex,
        currentShareIndex + sharesToGive,
      );
      currentShareIndex += sharesToGive;

      shareUpdates.push({
        companyId: order.companyId,
        where: { id: { in: shares.map((share) => share.id) } },
        data: {
          location: ShareLocation.PLAYER,
          playerId: order.playerId,
        },
      });

      playerCashUpdates.push({
        playerId: order.playerId,
        decrement: sharesToGive * order.Company.currentStockPrice!,
      });

      orderStatusUpdates.push({
        where: { id: order.id },
        data: { orderStatus: OrderStatus.FILLED },
      });

      gameLogEntries.push({
        game: { connect: { id: order.gameId } },
        content: `Player ${
          order.Player.nickname
        } has bought ${sharesToGive} shares of ${
          order.Company.name
        } at $${order.Company.currentStockPrice?.toFixed(2)}`,
      });

      remainingShares -= sharesToGive;
    }
  }

  /**
   * Distributing shares in fair split strategy
   * @param sortedByPhaseCreatedAt
   * @param allAvailableShares
   * @param remainingShares
   * @param currentShareIndex
   * @param shareUpdates
   * @param playerCashUpdates
   * @param orderStatusUpdates
   * @param gameLogEntries
   */
  distributeWithinPhases(
    sortedByPhaseCreatedAt: any[],
    allAvailableShares: Share[],
    remainingShares: number,
    currentShareIndex: number,
    shareUpdates: any[],
    playerCashUpdates: { playerId: string; decrement: number }[],
    orderStatusUpdates: any[],
    gameLogEntries: any[],
  ) {
    for (const groupedOrders of sortedByPhaseCreatedAt) {
      if (remainingShares <= 0) break;

      const totalSharesInPhase = groupedOrders.orders.reduce(
        (acc: number, order: PlayerOrder) => acc + (order.quantity || 0),
        0,
      );
      if (totalSharesInPhase > remainingShares) {
        const sharesPerBuyer = this.proportionalDistribution(
          groupedOrders.orders,
          remainingShares,
          allAvailableShares,
          currentShareIndex,
          shareUpdates,
          playerCashUpdates,
          orderStatusUpdates,
          gameLogEntries,
        );
        this.lotteryAllocation(
          groupedOrders.orders,
          remainingShares,
          sharesPerBuyer,
          allAvailableShares,
          currentShareIndex,
          shareUpdates,
          playerCashUpdates,
          orderStatusUpdates,
          gameLogEntries,
        );
      } else {
        this.directFulfillment(
          groupedOrders.orders,
          remainingShares,
          allAvailableShares,
          currentShareIndex,
          shareUpdates,
          playerCashUpdates,
          orderStatusUpdates,
          gameLogEntries,
        );
      }
    }
  }

  async executeDatabaseOperations(
    prisma: any,
    shareUpdates: any[],
    playerCashUpdates: { playerId: string; decrement: number }[],
    orderStatusUpdates: any[],
    gameLogEntries: any[],
    gameId: string,
    gameTurnId: string,
    phaseId: string,
  ) {
    try {
      const BATCH_SIZE = 4;
      const MAX_RETRIES = 3;
      
      // CRITICAL: Validate all cash updates BEFORE any database operations to prevent negative balances
      // This must happen BEFORE share updates to ensure atomicity - if cash validation fails,
      // no changes should be made
      if (playerCashUpdates.length > 0) {
        // Aggregate cash updates per player to catch over-spending
        const aggregatedCashUpdates = new Map<string, number>();
        for (const update of playerCashUpdates) {
          const currentTotal = aggregatedCashUpdates.get(update.playerId) || 0;
          aggregatedCashUpdates.set(update.playerId, currentTotal + update.decrement);
        }
        
        // Validate each player has sufficient funds for their total decrements
        const playerIds = Array.from(aggregatedCashUpdates.keys());
        const players = await prisma.player.findMany({
          where: { id: { in: playerIds } },
          select: { id: true, cashOnHand: true, nickname: true },
        });
        
        for (const player of players) {
          const totalDecrement = aggregatedCashUpdates.get(player.id) || 0;
          if (player.cashOnHand < totalDecrement) {
            throw new Error(
              `Insufficient funds: Player ${player.nickname || player.id} has $${player.cashOnHand} but total decrements are $${totalDecrement}. Transaction aborted to prevent negative balance.`
            );
          }
        }
      }
      
      // Now safe to proceed with database operations
      for (let i = 0; i < shareUpdates.length; i += BATCH_SIZE) {
        const batch = shareUpdates.slice(i, i + BATCH_SIZE);
        await prisma.$transaction(
          batch.map((update) => prisma.share.updateMany(update)),
        );
      }

      for (let i = 0; i < playerCashUpdates.length; i += BATCH_SIZE) {
        const batch = playerCashUpdates.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map((update) =>
            this.retry(
              () =>
                this.playerRemoveMoney(
                  gameId,
                  gameTurnId,
                  phaseId,
                  update.playerId,
                  update.decrement,
                  EntityType.BANK,
                  `Share purchase.`,
                ),
              MAX_RETRIES,
            ),
          ),
        );
      }

      for (let i = 0; i < orderStatusUpdates.length; i += BATCH_SIZE) {
        const batch = orderStatusUpdates.slice(i, i + BATCH_SIZE);
        await prisma.$transaction(
          batch.map((update) => prisma.playerOrder.update(update)),
        );
      }

      for (let i = 0; i < gameLogEntries.length; i += BATCH_SIZE) {
        const batch = gameLogEntries.slice(i, i + BATCH_SIZE);
        await prisma.$transaction(
          batch.map((entry) => prisma.gameLog.create({ data: entry })),
        );
      }
    } catch (error) {
      console.error('Error distributing shares:', error);
    }
  }

  async playerAddMoney({
    gameId,
    gameTurnId,
    phaseId,
    playerId,
    amount,
    fromEntity,
    description,
    fromEntityId,
    transactionType,
    transactionSubType,
  }: {
    gameId: string;
    gameTurnId: string;
    phaseId: string;
    playerId: string;
    amount: number;
    fromEntity: EntityType;
    description?: string;
    fromEntityId?: string;
    transactionType?: TransactionType;
    transactionSubType?: TransactionSubType;
  }) {
    //get player fromm id
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
    });
    if (!player) {
      throw new Error('Player not found playerAddMoney');
    }
    //TODO: What if entity is not from the BANK?
    //update bank pool for game
    await this.prisma.game.update({
      where: { id: gameId },
      data: {
        bankPoolNumber: {
          decrement: amount,
        },
      },
    });
    const updatedPlayer = await this.prisma.player.update({
      where: { id: playerId },
      data: {
        cashOnHand: {
          increment: amount,
        },
      },
    });
    //create transaction
    this.transactionService
      .createTransactionEntityToEntity({
        gameId,
        gameTurnId,
        phaseId,
        amount,
        fromEntityType: fromEntity,
        transactionType: TransactionType.CASH,
        toEntityId: player.entityId || undefined,
        toEntityType: EntityType.PLAYER,
        toPlayerId: playerId,
        description,
        transactionSubType,
      })
      .catch((error) => {
        console.error('Error creating transaction:', error);
      });
    return updatedPlayer;
  }

  async playerRemoveMoney(
    gameId: string,
    gameTurnId: string,
    phaseId: string,
    playerId: string,
    amount: number,
    toEntity: EntityType,
    description?: string,
    toEntityId?: string,
  ) {
    //get player
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
    });
    if (!player) {
      throw new Error('Player not found');
    }
    
    // CRITICAL: Validate player has sufficient funds BEFORE processing
    // Negative balances should NEVER occur - fail the transaction if insufficient funds
    if (player.cashOnHand < amount) {
      throw new Error(
        `Insufficient funds: Player ${playerId} attempted to remove $${amount} but only has $${player.cashOnHand}. Transaction failed to prevent negative balance.`
      );
    }
    
    //create transaction
    this.transactionService
      .createTransactionEntityToEntity({
        gameId,
        gameTurnId,
        phaseId,
        amount,
        fromEntityId: player.entityId || undefined,
        fromEntityType: EntityType.PLAYER,
        fromPlayerId: playerId,
        transactionType: TransactionType.CASH,
        toEntityType: toEntity,
        toEntityId,
        description,
      })
      .catch((error) => {
        console.error('Error creating transaction:', error);
      });
    //update bank pool for game
    await this.prisma.game.update({
      where: { id: gameId },
      data: {
        bankPoolNumber: {
          increment: amount,
        },
      },
    });
    const updatedPlayer = await this.prisma.player.update({
      where: { id: playerId },
      data: {
        cashOnHand: {
          decrement: amount,
        },
      },
    });

    return updatedPlayer;
  }

  async playerRemoveShares({
    gameId,
    gameTurnId,
    phaseId,
    playerId,
    companyId,
    amount,
    fromLocation,
    toLocation,
    toEntityType,
    fromEntityId,
    fromEntityType,
    fromPlayerId,
    description,
  }: {
    gameId: string;
    gameTurnId: string;
    phaseId: string;
    playerId: string;
    companyId: string;
    amount: number;
    fromLocation: ShareLocation;
    toLocation: ShareLocation;
    toEntityType: EntityType;
    fromEntityId?: string;
    fromEntityType: EntityType;
    fromPlayerId?: string;
    description?: string;
  }) {
    //get player
    const player = await this.playersService.player({
      id: playerId,
    });
    if (!player) {
      throw new Error('Player not found');
    }
    //get company
    const company = await this.companyService.company({
      id: companyId,
    });
    if (!company) {
      throw new Error('Company not found');
    }
    //get shares
    const shares = await this.prisma.share.findMany({
      where: {
        playerId,
        companyId,
        location: fromLocation,
      },
      take: amount,
    });
    //if player does not have enough shares, throw error
    if (shares.length < amount) {
      throw new Error(
        'Player does not have enough shares to complete playerRemoveShares',
      );
    }
    //create transaction
    this.transactionService
      .createTransactionEntityToEntity({
        gameId,
        gameTurnId,
        phaseId,
        amount: shares.length,
        fromEntityId,
        fromEntityType,
        fromPlayerId,
        transactionType: TransactionType.SHARE,
        toEntityType,
        description,
      })
      .catch((error) => {
        console.error('Error creating transaction:', error);
      });
    //update shares
    await this.prisma.share.updateMany({
      where: {
        id: { in: shares.map((share) => share.id) },
      },
      data: {
        location: toLocation,
        playerId: null,
      },
    });
    return shares;
  }

  async haveAllActiveCompaniesActionsResolved(gameId: string) {
    // Get the current operating round
    const game = await this.gamesService.getGameState(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    // Get all active companies in the game
    const companies = await this.companyService.companies({
      where: {
        gameId,
        status: CompanyStatus.ACTIVE,
      },
    });

    if (!game.currentOperatingRoundId) {
      throw new Error('Current operating round not found');
    }
    const currentOperatingRound =
      await this.operatingRoundService.operatingRoundWithCompanyActions({
        id: game.currentOperatingRoundId,
      });
    if (!currentOperatingRound) {
      throw new Error('Operating round not found');
    }

    if (companies.length > currentOperatingRound.companyActions.length) {
      return false;
    }

    // Adjust company tiers based on actions taken
    const companiesWithAdjustedTier = companies.map((company) => {
      const companyAction = currentOperatingRound.companyActions.find(
        (action) => action.companyId === company.id,
      );
      return {
        ...company,
        companyTier: this.getAdjustedCompanyTier(company, companyAction),
      };
    });

    // Calculate the total expected company actions
    const totalCompanyActions = companiesWithAdjustedTier.reduce(
      (acc, company) =>
        acc + CompanyTierData[company.companyTier].companyActions,
      0,
    );

    // Check if all actions are resolved
    const resolvedCompanyActions = currentOperatingRound.companyActions.filter(
      (action) => action.resolved,
    );

    // Check if all companies have at least one action
    const companiesWithVotedActions = companiesWithAdjustedTier.filter(
      (company) =>
        currentOperatingRound.companyActions.some(
          (action) => action.companyId === company.id,
        ),
    );
    // Return true if all companies have at least one voted action
    return companiesWithVotedActions.length === companies.length;

    // Optionally check if all actions are resolved
    // console.log('resolvedCompanyActions', resolvedCompanyActions.length);
    // console.log('totalCompanyActions', totalCompanyActions);
    // return resolvedCompanyActions.length >= totalCompanyActions;
  }

  getAdjustedCompanyTier(company: Company, action?: CompanyAction) {
    if (action?.action === OperatingRoundAction.EXPANSION) {
      return getPreviousCompanyTier(company.companyTier);
    }
    if (action?.action === OperatingRoundAction.DOWNSIZE) {
      return getNextCompanyTier(company.companyTier);
    }
    return company.companyTier;
  }

  async doesNextPhaseNeedToBePlayed(phaseName: PhaseName, currentPhase: Phase) {
    switch (phaseName) {
      case PhaseName.HEADLINE_RESOLVE:
        return this.doesHeadlingResolveNeedToBePlayed(currentPhase.gameId);
      case PhaseName.SET_COMPANY_IPO_PRICES:
      case PhaseName.RESOLVE_SET_COMPANY_IPO_PRICES:
        return this.isThereAnyCompanyIPOPriceToSet(currentPhase.gameId);
      case PhaseName.PRIZE_VOTE_ACTION:
      case PhaseName.PRIZE_VOTE_RESOLVE:
        return this.isPrizeRoundTurn(currentPhase?.gameId || '');
      case PhaseName.PRIZE_DISTRIBUTE_ACTION:
      case PhaseName.PRIZE_DISTRIBUTE_RESOLVE:
        const isPrizeRoundTurn = await this.isPrizeRoundTurn(
          currentPhase?.gameId || '',
        );
        if (isPrizeRoundTurn) {
          return this.wereAnyPrizesWon(currentPhase?.gameId || '');
        }
        return false;
      case PhaseName.STOCK_ACTION_REVEAL:
        return this.isStockActionRevealNecessary(currentPhase?.gameId || '');
      case PhaseName.STOCK_RESOLVE_LIMIT_ORDER:
        //count limit orders
        return this.limitOrdersRequiringFulfillment(currentPhase?.gameId || '');
      case PhaseName.STOCK_RESOLVE_MARKET_ORDER:
        if (currentPhase?.stockRoundId) {
          return this.stockOrdersRequiredResolution(currentPhase.stockRoundId);
        }
        return;
      case PhaseName.STOCK_SHORT_ORDER_INTEREST:
        return this.stockOrdersOpen(currentPhase?.gameId || '');
      case PhaseName.STOCK_ACTION_SHORT_ORDER:
        return this.stockOrdersOpen(currentPhase?.gameId || '');
      case PhaseName.STOCK_RESOLVE_PENDING_SHORT_ORDER:
        if (currentPhase?.stockRoundId) {
          return this.stockOrdersPending(currentPhase.stockRoundId);
        }
        return;
      case PhaseName.STOCK_OPEN_LIMIT_ORDERS:
        return this.limitOrdersPending(currentPhase?.stockRoundId || '');
      case PhaseName.STOCK_RESOLVE_OPTION_ORDER:
        return this.anyOptionOrdersPurchased(currentPhase?.gameId || '');
      case PhaseName.STOCK_RESOLVE_PENDING_OPTION_ORDER:
        if (currentPhase?.stockRoundId) {
          return this.optionOrdersPending(currentPhase.stockRoundId);
        }
        return;
      case PhaseName.STOCK_ACTION_OPTION_ORDER:
        return this.anyOptionOrdersToBeExercised(currentPhase?.gameId || '');
      // AUTO-FORWARD: Skip if no factory construction orders were submitted
      case PhaseName.FACTORY_CONSTRUCTION_RESOLVE:
        return this.hasFactoryConstructionOrders(currentPhase);
      // AUTO-FORWARD: Skip if no insolvent companies exist
      case PhaseName.RESOLVE_INSOLVENCY:
        return this.hasInsolventCompanies(currentPhase);
      // AUTO-FORWARD: Skip if there are no earnings (profit > 0)
      case PhaseName.EARNINGS_CALL:
        return this.hasEarnings(currentPhase);
      // AUTO-FORWARD: Skip if there are no consumers served this turn
      case PhaseName.OPERATING_PRODUCTION_VOTE:
      case PhaseName.OPERATING_PRODUCTION_VOTE_RESOLVE:
        return this.hasConsumersServed(currentPhase);
      // AUTO-FORWARD: Skip if no sector has advanced beyond research stage 1
      case PhaseName.RUSTED_FACTORY_UPGRADE:
        return this.hasAdvancedResearchStage(currentPhase);
      // AUTO-FORWARD: Capital Gains and Divestment are always auto-processed before END_TURN
      // They don't require player ready-up and are handled automatically
      case PhaseName.CAPITAL_GAINS:
      case PhaseName.DIVESTMENT:
        return false;
      default:
        return true;
    }
  }

  /**
   * Check if there are any insolvent companies in the game
   * @param currentPhase - The current phase object
   * @returns true if there are insolvent companies, false otherwise
   */
  async hasInsolventCompanies(currentPhase: Phase): Promise<boolean> {
    if (!currentPhase?.gameId) {
      return false;
    }

    // Check if there are any insolvent companies in the game
    const insolventCompanies = await this.companyService.companies({
      where: {
        gameId: currentPhase.gameId,
        status: CompanyStatus.INSOLVENT,
      },
    });

    return insolventCompanies && insolventCompanies.length > 0;
  }

  /**
   * Check if there are any factory construction orders for the current turn
   * @param currentPhase - The current phase object
   * @returns true if there are orders to resolve, false otherwise
   */
  async hasFactoryConstructionOrders(currentPhase: Phase): Promise<boolean> {
    if (!currentPhase?.gameTurnId) {
      return false;
    }
    
    // Check if there are any factory construction orders for this turn
    // Orders are created during FACTORY_CONSTRUCTION phase and resolved in FACTORY_CONSTRUCTION_RESOLVE
    const orderCount = await this.prisma.factoryConstructionOrder.count({
      where: { 
        gameTurnId: currentPhase.gameTurnId,
      },
    });
    
    return orderCount > 0;
  }

  /**
   * Check if there are any earnings (profit > 0) for the current turn
   * @param currentPhase - The current phase object
   * @returns true if there are earnings, false otherwise
   */
  async hasEarnings(currentPhase: Phase): Promise<boolean> {
    if (!currentPhase?.gameTurnId) {
      return false;
    }

    // Check if there are any FactoryProduction records with customersServed > 0 for this turn
    // Note: We check customersServed (not profit) because profit is calculated DURING the earnings call phase
    // If we checked profit > 0, the phase would always be skipped since profit starts at 0 until earnings call runs
    // After earnings call runs, profit might be > 0, so we check if any records exist that need processing
    const productionCount = await this.prisma.factoryProduction.count({
      where: {
        gameTurnId: currentPhase.gameTurnId,
        customersServed: { gt: 0 },
      },
    });

    return productionCount > 0;
  }

  /**
   * Check if there are any consumers served for the current turn
   * @param currentPhase - The current phase object
   * @returns true if there are consumers served, false otherwise
   */
  async hasConsumersServed(currentPhase: Phase): Promise<boolean> {
    if (!currentPhase?.gameTurnId) {
      return false;
    }

    // Check if there are any FactoryProduction records with customersServed > 0 for this turn
    const productionCount = await this.prisma.factoryProduction.count({
      where: {
        gameTurnId: currentPhase.gameTurnId,
        customersServed: { gt: 0 },
      },
    });

    return productionCount > 0;
  }

  /**
   * Check if any sector has just transitioned to a new research stage
   * The phase should only run when transitioning between stages:
   * - Stage 1 → Stage 2: researchMarker = 6 (crossed from 0-5 to 6-10)
   * - Stage 2 → Stage 3: researchMarker = 11 (crossed from 6-10 to 11-15)
   * - Stage 3 → Stage 4: researchMarker = 16 (crossed from 11-15 to 16-20)
   * @param currentPhase - The current phase object
   * @returns true if any sector is at a stage boundary (6, 11, or 16), false otherwise
   */
  async hasAdvancedResearchStage(currentPhase: Phase): Promise<boolean> {
    if (!currentPhase?.gameId) {
      return false;
    }

    // Check if any sector is at a stage transition boundary
    // Stage 1→2: researchMarker = 6
    // Stage 2→3: researchMarker = 11
    // Stage 3→4: researchMarker = 16
    const sectorCount = await this.prisma.sector.count({
      where: {
        gameId: currentPhase.gameId,
        researchMarker: { in: [6, 11, 16] },
      },
    });

    return sectorCount > 0;
  }

  async isThereAnyCompanyIPOPriceToSet(gameId: string): Promise<boolean> {
    const count = await this.prisma.company.count({
      where: {
        gameId,
        status: CompanyStatus.INACTIVE,
        ipoAndFloatPrice: null,
      },
    });
    return count > 0;
  }

  async doesHeadlingResolveNeedToBePlayed(gameId: string) {
    //get game
    const game = await this.gamesService.getGameState(gameId);
    if (!game) {
      throw new Error('Game not found');
    }
    //get game turn
    const gameTurn = await this.gameTurnService.gameTurn({
      id: game.currentTurn || '',
    });
    if (!gameTurn) {
      throw new Error('Game turn not found');
    }
    //if the game turn is greater than or equal to 2, return true
    return gameTurn.turn >= 2;
  }

  async wereAnyPrizesWon(gameId: string) {
    //check if any prize votes were cast during the current turn
    //get game
    const game = await this.gamesService.getGameState(gameId);
    if (!game) {
      throw new Error('Game not found');
    }
    //get game turn
    const gameTurn = await this.gameTurnService.gameTurn({
      id: game.currentTurn || '',
    });
    if (!gameTurn) {
      throw new Error('Game turn not found');
    }
    //get all prizes for the current turn that have a playerId
    //these are prizes that have been assigned a winner
    const prizesWithPlayerId = await this.prizeService.listPrizes({
      where: {
        gameId,
        gameTurnId: gameTurn.id,
        playerId: { not: null },
      },
    });
    //return true if any prize votes were cast
    return prizesWithPlayerId.length > 0;
  }

  async isStockActionRevealNecessary(gameId: string) {
    //get game
    const game = await this.gamesService.getGameState(gameId);
    if (!game) {
      throw new Error('Game not found');
    }
    //check if player orders are concealed
    return game.playerOrdersConcealed;
  }

  async isPrizeRoundTurn(gameId: string) {
    const game = await this.gamesService.getGameState(gameId);
    if (!game) {
      throw new Error('Game not found');
    }
    //get game turn
    const gameTurn = await this.gameTurnService.gameTurn({
      id: game.currentTurn || '',
    });
    if (!gameTurn) {
      throw new Error('Game turn not found');
    }
    //if current turn is divisible by 3, return false
    return gameTurn.turn % 3 === 0;
  }

  async anyOptionOrdersPurchased(gameId: string) {
    const playerOrders =
      await this.playerOrderService.playerOrdersWithCompanyAndOptionContract({
        where: {
          gameId,
          orderType: OrderType.OPTION,
          orderStatus: OrderStatus.OPEN,
        },
      });
    return playerOrders.length > 0;
  }

  async anyOptionOrdersToBeExercised(gameId: string) {
    const playerOrders =
      await this.playerOrderService.playerOrdersWithCompanyAndOptionContract({
        where: {
          gameId,
          orderType: OrderType.OPTION,
          orderStatus: OrderStatus.OPEN,
        },
      });
    return (
      playerOrders.filter(
        (order) =>
          order.Company.currentStockPrice ||
          0 >= (order.OptionContract?.strikePrice || 0),
      ).length > 0
    );
  }

  async optionOrdersPending(stockRoundId: string) {
    const playerOrders = await this.playerOrderService.playerOrders({
      where: {
        stockRoundId,
        orderType: OrderType.OPTION,
        orderStatus: OrderStatus.PENDING,
      },
    });
    return playerOrders.length > 0;
  }

  async limitOrdersPending(stockRoundId: string) {
    const playerOrders = await this.playerOrderService.playerOrders({
      where: {
        stockRoundId,
        orderType: OrderType.LIMIT,
        orderStatus: OrderStatus.PENDING,
      },
    });
    return playerOrders.length > 0;
  }

  async stockOrdersPending(stockRoundId: string) {
    const playerOrders = await this.playerOrderService.playerOrders({
      where: {
        stockRoundId,
        orderType: OrderType.SHORT,
        orderStatus: OrderStatus.PENDING,
      },
    });
    return playerOrders.length > 0;
  }

  async stockOrdersOpen(gameId: string) {
    const playerOrders = await this.playerOrderService.playerOrders({
      where: {
        gameId,
        orderType: OrderType.SHORT,
        orderStatus: OrderStatus.OPEN,
      },
    });
    return playerOrders.length > 0;
  }

  async stockOrdersRequiredResolution(stockRoundId: string) {
    const playerOrders = await this.playerOrderService.playerOrders({
      where: {
        stockRoundId,
        orderType: OrderType.MARKET,
        orderStatus: OrderStatus.PENDING,
      },
    });
    return playerOrders.length > 0;
  }
  async limitOrdersRequiringFulfillment(gameId: string) {
    const playerOrders = await this.playerOrderService.playerOrders({
      where: {
        gameId,
        orderType: OrderType.LIMIT,
        orderStatus: OrderStatus.FILLED_PENDING_SETTLEMENT,
      },
    });
    return playerOrders.length > 0;
  }
  async exerciseOptionContract(id: number): Promise<OptionContract> {
    //get the option contract with related player orders
    const optionContract = await this.optionContractService.getOptionContract({
      id,
    });
    //throw error if option contract not found
    if (!optionContract) {
      throw new Error('Option contract not found');
    }
    //find the player order that's open
    const playerOrder = optionContract.PlayerOrders.find(
      (order) => order.orderStatus === 'OPEN',
    );
    // throw error if player order not found
    if (!playerOrder) {
      throw new Error('Player order not found');
    }
    //update player order to filled
    await this.playerOrderService.updatePlayerOrder({
      where: { id: playerOrder.id },
      data: { orderStatus: OrderStatus.FILLED },
    });
    //get game
    const game = await this.gamesService.getGameState(optionContract.gameId);
    //throw error if game not found
    if (!game) {
      throw new Error('Game not found');
    }
    //grant step bonus
    await this.stockHistoryService.moveStockPriceUp(
      optionContract.gameId,
      optionContract.companyId,
      game.currentPhaseId || '',
      optionContract.Company.currentStockPrice || 0,
      optionContract.stepBonus,
      StockAction.CALL_OPTION,
    );
    //give the player the money from the option contract which is the difference between the current stock price and the strike price
    await this.playerAddMoney({
      gameId: optionContract.gameId,
      gameTurnId: game.currentTurn || '',
      phaseId: game.currentPhaseId || '',
      playerId: playerOrder.playerId,
      amount:
        (optionContract.Company.currentStockPrice ||
          0 - (optionContract.strikePrice || 0)) * optionContract.shareCount,
      fromEntity: EntityType.BANK,
      description: `Option contract for ${optionContract.Company.name} exercised`,
      transactionSubType: TransactionSubType.OPTION_CALL_EXERCISE,
    });
    //get player
    const player = await this.playersService.player({
      id: playerOrder.playerId,
    });
    //throw error if player not found
    if (!player) {
      throw new Error('Player not found');
    }
    //game log
    await this.gameLogService.createGameLog({
      game: { connect: { id: optionContract.gameId } },
      content: `Player ${
        player.nickname
      } has exercised an option contract for ${
        optionContract.Company.name
      } at $${optionContract.Company.currentStockPrice?.toFixed(2)}`,
    });
    const updatedOptionContract =
      await this.optionContractService.updateOptionContract({
        where: { id },
        data: {
          contractState: ContractState.EXERCISED,
          exercisePrice: optionContract.Company.currentStockPrice,
        },
      });
    //return the option contract
    return updatedOptionContract;
  }

  async coverShortOrder(shortOrderId: number) {
    //get the short order
    const shortOrder = await this.shortOrdersService.getShortOrder({
      id: shortOrderId,
    });
    if (!shortOrder) {
      throw new Error('Short order not found');
    }
    //ensure it has not already been covered
    if (shortOrder.coverPrice) {
      throw new Error('Short order already covered');
    }
    //get the price of the stock
    const stockPrice = shortOrder.Company.currentStockPrice;
    //get the player
    const player = await this.playersService.player({
      id: shortOrder.PlayerOrder?.playerId || '',
    });
    if (!player) {
      throw new Error('Player not found');
    }
    //get game
    const game = await this.gamesService.getGameState(player.gameId);
    if (!game) {
      throw new Error('Game not found');
    }
    this.transactionService
      .createTransactionEntityToEntity({
        fromEntityId: MARGIN_ACCOUNT_ID_PREFIX + player.id,
        fromEntityType: EntityType.PLAYER_MARGIN_ACCOUNT,
        toEntityType: EntityType.PLAYER,
        toEntityId: player.entityId || undefined,
        toPlayerId: player.id,
        amount: Math.floor(shortOrder.shortSalePrice / 2),
        transactionType: TransactionType.CASH,
        gameId: player.gameId,
        gameTurnId: game.currentTurn || '',
        phaseId: game.currentPhaseId || '',
        description: 'Margin account funds released',
      })
      .catch((error) => {
        console.error('Error creating transaction:', error);
      });
    //release the margin account funds
    this.playersService.updatePlayer({
      where: { id: player.id },
      data: {
        marginAccount: {
          decrement: Math.floor(shortOrder.shortSalePrice / 2),
        },
        cashOnHand: {
          increment: Math.floor(shortOrder.shortSalePrice / 2),
        },
      },
    });
    //cover the short by "buying back" the shares
    await this.playerRemoveMoney(
      player.gameId,
      game.currentTurn || '',
      game.currentPhaseId || '',
      player.id,
      shortOrder.Company.currentStockPrice || 0 * shortOrder.Share.length,
      EntityType.BANK,
      `Cover short order ${shortOrder.id} for ${shortOrder.Company.name}`,
    );
    //put the shares back in the open market
    await this.shareService.updateManySharesUnchecked({
      where: {
        id: { in: shortOrder.Share.map((share) => share.id) },
      },
      data: {
        location: ShareLocation.OPEN_MARKET,
        playerId: null,
      },
    });
    //calculate steps by shares
    const slotsToFill = shortOrder.Share.length;
    let currentTier = shortOrder.Company.stockTier;
    let currentTierSize = stockTierChartRanges.find(
      (range) => range.tier === currentTier,
    );

    const { steps, newTierSharesFulfilled, newTier, newSharePrice } =
      calculateStepsAndRemainder(
        slotsToFill,
        shortOrder.Company.tierSharesFulfilled,
        currentTierSize?.fillSize ?? 0,
        shortOrder.Company.currentStockPrice ?? 0,
      );
    //move stock price up by steps
    await this.stockHistoryService.moveStockPriceUp(
      player.gameId,
      shortOrder.companyId,
      game.currentPhaseId || '',
      shortOrder.Company.currentStockPrice || 0,
      steps,
      StockAction.SHORT,
    );
    //update short with cover price
    const updatedShortOrder = await this.shortOrdersService.updateShortOrder({
      where: { id: shortOrderId },
      data: {
        coverPrice: stockPrice,
      },
    });
    if (!updatedShortOrder.playerOrderId) {
      throw new Error('No player order id found.');
    }
    //update player order to filled
    const playerOrder = await this.playerOrderService.updatePlayerOrder({
      where: {
        id: updatedShortOrder.playerOrderId,
      },
      data: {
        orderStatus: OrderStatus.FILLED,
      },
    });
    //increase the action counter for the short order
    await this.playersService.addActionCounter(
      player.id,
      playerOrder.orderType,
    );
    //game log
    await this.gameLogService.createGameLog({
      game: { connect: { id: player.gameId } },
      content: `Player ${player.nickname} has covered short order ${
        updatedShortOrder.id
      } for ${shortOrder.Company.name} at $${stockPrice?.toFixed(2)}`,
    });
  }
  /**
   * Pause the current game.
   */
  public async pauseGame(gameId: string) {
    // Logic to pause the game, e.g., set a paused flag in the game model
    await this.prisma.game.update({
      where: { id: gameId },
      data: { isPaused: true },
    });
  }

  /**
   * Resume the current game.
   */
  public async resumeGame(gameId: string) {
    // Logic to resume the game, e.g., clear the paused flag in the game model
    await this.prisma.game.update({
      where: { id: gameId },
      data: { isPaused: false },
    });
    // Resume the timers
    await this.resumeTimerForGame(gameId);
  }

  /**
   * Resume the timer for a specific game.
   *
   * @param gameId - The ID of the game to resume the timer for.
   */
  public async resumeTimerForGame(gameId: string) {
    //get game
    const game = await this.gamesService.game({ id: gameId });
    if (!game) {
      throw new Error('Game not found');
    }
    //get current phase
    const phase = await this.phaseService.currentPhase(gameId);
    if (!phase) {
      throw new Error('Phase not found');
    }
    await this.startPhaseTimer({
      phase,
      gameId: gameId,
      stockRoundId: game.currentStockRoundId || undefined,
      operatingRoundId: game.currentOperatingRoundId || undefined,
      influenceRoundId: undefined,
    });
  }

  public async createPlayerOrder({
    orderType,
    location,
    quantity,
    value,
    isSell,
    orderStatus,
    gameId,
    companyId,
    playerId,
    contractId,
    submissionStamp,
    ipoAndFloatPrice,
  }: {
    orderType: 'MARKET' | 'SHORT' | 'LIMIT' | 'OPTION';
    location: 'OPEN_MARKET' | 'IPO' | 'PLAYER' | 'DERIVATIVE_MARKET';
    quantity?: number;
    value?: number;
    isSell?: boolean;
    orderStatus: OrderStatus;
    gameId: string;
    companyId: string;
    playerId: string;
    contractId?: number;
    ipoAndFloatPrice?: number;
    submissionStamp: Date | undefined;
  }) {
    //get game
    const game = await this.gamesService.game({ id: gameId });
    if (!game) {
      throw new Error('Game not found');
    }
    //get current phase
    const phase = await this.phaseService.currentPhase(gameId);
    if (!phase) {
      throw new Error('Phase not found');
    }
    //get company associated with order
    const company = await this.companyService.company({ id: companyId });
    if (!company) {
      throw new Error('Company not found');
    }
    if (!game.useLimitOrders && orderType === OrderType.LIMIT) {
      throw new Error('Limit orders are not enabled for this game');
    }
    if (!game.useShortOrders && orderType === OrderType.SHORT) {
      throw new Error('Short orders are not enabled for this game');
    }
    if (!game.useOptionOrders && orderType === OrderType.OPTION) {
      throw new Error('Options are not enabled for this game');
    }
    if (!game.currentStockRoundId) {
      throw new Error('Stock round not found');
    }
    if (!game.currentPhaseId) {
      throw new Error('Current Phase ID not found');
    }
    if (!phase.stockSubRoundId) {
      throw new Error('Stock sub round not found');
    }
    return this.playerOrderService.createPlayerOrder({
      orderType,
      location,
      quantity,
      value,
      isSell,
      orderStatus,
      ipoAndFloatPrice,
      Game: { connect: { id: gameId } },
      Company: { connect: { id: companyId } },
      Player: { connect: { id: playerId } },
      OptionContract: contractId ? { connect: { id: contractId } } : undefined,
      submissionStamp,
      StockRound: { connect: { id: game.currentStockRoundId } },
      StockSubRound: { connect: { id: phase.stockSubRoundId } },
      Phase: { connect: { id: game.currentPhaseId } },
      Sector: { connect: { id: company.sectorId } },
      GameTurn: { connect: { id: game.currentTurn } },
    });
  }

  async distributeCash({
    playerId,
    amount,
    prize,
  }: {
    playerId: string;
    amount: number;
    prize: PrizeWithSectorPrizes;
  }) {
    // get player
    const player = await this.playersService.player({
      id: playerId,
    });
    if (!player) {
      throw new Error('Player not found');
    }
    //get game
    const game = await this.gamesService.game({
      id: player.gameId,
    });
    if (!game) {
      throw new Error('Game not found');
    }
    if (!game.currentTurn || !game.currentPhaseId) {
      throw new Error('Game turn or phase not found');
    }
    if ((prize.cashAmount || 0) < amount) {
      throw new Error('Not enough cash in prize to distribute');
    }
    //add money to player
    this.playerAddMoney({
      gameId: game.id,
      gameTurnId: game.currentTurn,
      phaseId: game.currentPhaseId,
      playerId: player.id,
      amount,
      fromEntity: EntityType.BANK,
      description: 'Cash prize distribution',
      transactionSubType: TransactionSubType.TRANCHE,
    });
    //remove this amount from the prize
    await this.prizeService.updatePrize({
      where: { id: prize.id },
      data: { cashAmount: (prize.cashAmount || 0) - amount },
    });
    //game log
    this.gameLogService.createGameLog({
      game: { connect: { id: game.id } },
      content: `Player ${
        player.nickname
      } has won a cash prize of $${amount.toFixed(2)}`,
    });
    //create prize distribution
    this.prizeDistributionService.createPrizeDistribution({
      cashAmount: amount,
      distributionType: PrizeDistributionType.CASH,
      Player: { connect: { id: playerId } },
      Prize: { connect: { id: prize.id } },
      GameTurn: { connect: { id: game.currentTurn } },
    });
  }

  async distributePrestige({
    companyId,
    amount,
    prize,
  }: {
    companyId: string;
    amount: number;
    prize: PrizeWithSectorPrizes;
  }) {
    //get company
    const company = await this.companyService.company({
      id: companyId,
    });
    if (!company) {
      throw new Error('Company not found');
    }
    if ((prize.prestigeAmount || 0) < amount) {
      throw new Error('Not enough prestige in prize to distribute');
    }
    //update prestige
    await this.companyService.updateCompany({
      where: { id: companyId },
      data: { prestigeTokens: company.prestigeTokens + amount },
    });
    //update prize
    await this.prizeService.updatePrize({
      where: { id: prize.id },
      data: { prestigeAmount: (prize.prestigeAmount || 0) - amount },
    });
    //game log
    await this.gameLogService.createGameLog({
      game: { connect: { id: company.gameId } },
      content: `${company.name} has won a prestige prize of ${amount} tokens`,
    });
    //create prize distribution
    await this.prizeDistributionService.createPrizeDistribution({
      prestigeAmount: amount,
      distributionType: PrizeDistributionType.PRESTIGE,
      Company: { connect: { id: companyId } },
      Prize: { connect: { id: prize.id } },
    });
  }

  /**
   * Grants a company the passive action.
   * @param param0
   */
  async applyPassiveEffect({
    companyId,
    effectName,
    prize,
  }: {
    companyId: string;
    effectName: OperatingRoundAction;
    prize?: PrizeWithSectorPrizes;
  }) {
    //get company
    const company = await this.companyService.company({
      id: companyId,
    });
    if (!company) {
      throw new Error('Company not found');
    }
    //get current turn
    const game = await this.gamesService.game({
      id: company.gameId,
    });
    if (!game) {
      throw new Error('Game not found');
    }
    //get company actions for company
    await this.companyActionService.companyActions({
      where: {
        Company: { id: companyId },
      },
    });
    //ensure this company has not already taken this action
    const existingAction = await this.companyActionService.companyActions({
      where: {
        companyId: companyId,
        action: effectName,
      },
    });
    if (existingAction.length > 0) {
      throw new Error('Company has already taken this action');
    }
    //create company action
    await this.companyActionService.createCompanyAction({
      Company: { connect: { id: company.id || '' } },
      GameTurn: { connect: { id: game.currentTurn || '' } },
      action: effectName,
      resolved: true,
      isPassive: true,
    });
    //TODO: Removing this for now, tentatively.  All companies in a sector can gain the action now.
    // //remove this action if it exists from any companies in the same sector except this one
    // const companiesInSector = await this.companyService.companies({
    //   where: {
    //     sectorId: company.sectorId,
    //     id: { not: companyId },
    //   },
    // });
    // //see if any companies in the sector have taken this action
    // const sectorActions = await this.companyActionService.companyActions({
    //   where: {
    //     companyId: { in: companiesInSector.map((c) => c.id) },
    //     action: effectName,
    //   },
    // });
    // //if so, remove the action
    // if (sectorActions.length > 0) {
    //   await this.companyActionService.deleteCompanyAction({
    //     id: sectorActions[0].id,
    //   });
    // }
    //game log
    await this.gameLogService.createGameLog({
      game: { connect: { id: game.id } },
      content: `${company.name} has taken the passive effect ${effectName}`,
    });
    if (prize) {
      //create prize distribution
      await this.prizeDistributionService.createPrizeDistribution({
        passiveEffect: effectName,
        distributionType: PrizeDistributionType.PASSIVE_EFFECT,
        Company: { connect: { id: companyId } },
        Prize: { connect: { id: prize.id } },
      });
    }
  }
  async getPrizesCurrentTurnForPlayer(
    playerId: string,
  ): Promise<PrizeWithSectorPrizes[]> {
    //get player
    const player = await this.playersService.player({ id: playerId });
    if (!player) {
      throw new Error('Player not found');
    }
    //get game
    const game = await this.gamesService.game({ id: player.gameId });
    if (!game) {
      throw new Error('Game not found');
    }
    if (!game.currentTurn) {
      throw new Error('Game turn not found');
    }
    //get prize for current turn for player
    const prizes = await this.prizeService.listPrizes({
      where: {
        gameTurnId: game.currentTurn,
        playerId,
      },
    });
    //if no prizes found, throw
    if (!prizes) {
      throw new Error('Prize not found');
    }
    return prizes;
  }

  /**
   * Set player readiness for the given game and player.
   * If all human (non-bot) players are ready, automatically
   * set bot players to ready as well.
   */
  async setPlayerReadiness(
    gameId: string,
    playerId: string,
    isReady: boolean,
  ): Promise<void> {
    if (!this.readinessStore[gameId]) {
      this.readinessStore[gameId] = [];
    }

    // 1) Update or create readiness for this player
    const readinessList = this.readinessStore[gameId];
    const existing = readinessList.find((p) => p.playerId === playerId);

    if (existing) {
      existing.isReady = isReady;
    } else {
      readinessList.push({ playerId, isReady });
    }

    // 2) Load all players (including bots)
    const allPlayers = await this.playersService.players({
      where: { gameId },
    });

    // 3) Check how many human players there are and if they're all ready
    //    "Human players" = isBot == false OR isBot is null in DB.
    const humanPlayers = allPlayers.filter((p) => !p.isBot);

    // 4) Are all human players ready?
    const allHumansReady = humanPlayers.every((humanPlayer) => {
      const found = readinessList.find(
        (item) => item.playerId === humanPlayer.id,
      );
      return found?.isReady === true;
    });

    // 5) If all humans are ready, automatically set all bots as ready
    if (allHumansReady) {
      const botPlayers = allPlayers.filter((p) => p.isBot);
      for (const bot of botPlayers) {
        const found = readinessList.find((item) => item.playerId === bot.id);
        if (!found) {
          readinessList.push({ playerId: bot.id, isReady: true });
        } else {
          found.isReady = true;
        }
      }
    }

    // 6) If everyone (human + bot) is ready, handle transition
    const totalPlayers = allPlayers.length;
    if (
      this.readinessStore[gameId].length === totalPlayers &&
      this.readinessStore[gameId].every((p) => p.isReady)
    ) {
      // End timer if not timerless
      const game = await this.gamesService.game({ id: gameId });
      if (!game) throw new Error('Game not found');
      if (!game.isTimerless) {
        this.endPhaseTimer(gameId);
      }

      // Start next phase
      if (!game.currentPhaseId) throw new Error('No current phase');
      const currentPhase = await this.phaseService.phase({
        id: game.currentPhaseId,
      });
      if (!currentPhase) throw new Error('Phase not found');

      // Proceed
      this.handlePhaseTransition({
        phase: currentPhase,
        gameId,
      });
    }
  }

  //set all player readiness to false for gameId helper
  resetPlayerReadiness(gameId: string): void {
    this.readinessStore[gameId] = [];
  }

  listPlayerReadiness(gameId: string): PlayerReadiness[] {
    return this.readinessStore[gameId] || [];
  }

  async createIpoVote({
    playerId,
    companyId,
    ipoPrice,
  }: {
    playerId: string;
    companyId: string;
    ipoPrice: number;
  }) {
    //get company
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new Error('Company not found');
    }
    const gameId = company.gameId;
    const gameTurnId =
      this.gameCache.get(gameId)?.currentGameTurnId ??
      (await this.gameTurnService.getCurrentTurn(gameId))?.id;
    if (!gameTurnId) {
      throw new Error('Game turn not found');
    }
    //check if company is inactive
    if (company.status != CompanyStatus.INACTIVE) {
      throw new Error('Company is not inactive');
    }
    if (!stockGridPrices.includes(ipoPrice)) {
      throw new Error('IPO price is not a valid stock price');
    }
    //get sector
    const sector = await this.prisma.sector.findUnique({
      where: { id: company.sectorId },
    });
    if (!sector) {
      throw new Error('Sector not found');
    }
    if (ipoPrice < sector.ipoMin || ipoPrice > sector.ipoMax) {
      throw new Error('IPO price is not within sector range');
    }

    //ensure player has not already cast vote for this company
    const existingVote = await this.prisma.companyIpoPriceVote.findFirst({
      where: {
        playerId,
        companyId,
        gameTurnId,
      },
    });
    if (existingVote) {
      throw new Error('Player has already cast a vote for this company');
    }
    //create the IPO vote
    return await this.prisma.companyIpoPriceVote.create({
      data: {
        Player: { connect: { id: playerId } },
        Company: { connect: { id: companyId } },
        Game: { connect: { id: gameId } },
        GameTurn: { connect: { id: gameTurnId } },
        ipoPrice,
      },
    });
  }

  async createIpoVotesBatch(
    votes: Array<{
      playerId: string;
      companyId: string;
      ipoPrice: number;
    }>,
  ) {
    if (votes.length === 0) {
      throw new Error('At least one vote is required');
    }

    // Get all unique company IDs and player ID (should be same for all)
    const companyIds = [...new Set(votes.map((v) => v.companyId))];
    const playerId = votes[0].playerId;

    // Validate all votes have the same player
    if (!votes.every((v) => v.playerId === playerId)) {
      throw new Error('All votes must be from the same player');
    }

    // Fetch all companies in parallel
    const companies = await this.prisma.company.findMany({
      where: { id: { in: companyIds } },
      include: { Sector: true },
    });

    if (companies.length !== companyIds.length) {
      throw new Error('One or more companies not found');
    }

    // Get gameId and gameTurnId from first company (all should be in same game)
    const gameId = companies[0].gameId;
    const gameTurnId =
      this.gameCache.get(gameId)?.currentGameTurnId ??
      (await this.gameTurnService.getCurrentTurn(gameId))?.id;
    if (!gameTurnId) {
      throw new Error('Game turn not found');
    }

    // Validate all companies are in the same game
    if (!companies.every((c) => c.gameId === gameId)) {
      throw new Error('All companies must be in the same game');
    }

    // Create a map for quick lookup
    const companyMap = new Map(companies.map((c) => [c.id, c]));

    // Validate all votes before creating any
    for (const vote of votes) {
      const company = companyMap.get(vote.companyId);
      if (!company) {
        throw new Error(`Company ${vote.companyId} not found`);
      }

      // Check if company is inactive
      if (company.status !== CompanyStatus.INACTIVE) {
        throw new Error(`Company ${company.name} is not inactive`);
      }

      // Validate IPO price is valid
      if (!stockGridPrices.includes(vote.ipoPrice)) {
        throw new Error(`IPO price ${vote.ipoPrice} is not a valid stock price`);
      }

      // Validate IPO price is within sector range
      const sector = company.Sector;
      if (!sector) {
        throw new Error(`Sector not found for company ${company.name}`);
      }
      if (vote.ipoPrice < sector.ipoMin || vote.ipoPrice > sector.ipoMax) {
        throw new Error(
          `IPO price ${vote.ipoPrice} is not within sector range (${sector.ipoMin}-${sector.ipoMax}) for company ${company.name}`,
        );
      }
    }

    // Check for existing votes in a single query
    const existingVotes = await this.prisma.companyIpoPriceVote.findMany({
      where: {
        playerId,
        companyId: { in: companyIds },
        gameTurnId,
      },
    });

    if (existingVotes.length > 0) {
      const existingCompanyIds = existingVotes.map((v) => v.companyId);
      throw new Error(
        `Player has already cast votes for companies: ${existingCompanyIds.join(', ')}`,
      );
    }

    // Create all votes in a transaction
    return await this.prisma.$transaction(
      votes.map((vote) =>
        this.prisma.companyIpoPriceVote.create({
          data: {
            Player: { connect: { id: playerId } },
            Company: { connect: { id: vote.companyId } },
            Game: { connect: { id: gameId } },
            GameTurn: { connect: { id: gameTurnId } },
            ipoPrice: vote.ipoPrice,
          },
        }),
      ),
    );
  }

  async getIpoVotesForGameTurn(gameTurnId: string) {
    return await this.prisma.companyIpoPriceVote.findMany({
      where: {
        gameTurnId,
      },
      include: {
        Player: true,
      },
    });
  }

  /**
   * 1) INFLUENCE_BID_ACTION
   *    Example: Each bot decides how much influence to bid.
   */
  private async botHandleInfluenceBidAction(gameId: string): Promise<void> {
    // 1) Get BOT players for this game
    const botPlayers = await this.aiBotService.getBotPlayers(gameId);
    if (!botPlayers.length) return;

    // 2) Retrieve the current InfluenceRound (assuming you have a method to do so)
    //    If your logic requires a different approach (e.g. looking up by gameTurn),
    //    adjust accordingly.
    const influenceRound = await this.prisma.influenceRound.findFirst({
      where: { gameId /* possibly: roundStep: 0, or gameTurnId: ??? */ },
      orderBy: { id: 'desc' }, // or however you pick the "current" round
    });
    if (!influenceRound) {
      console.log(`No active influence round found for game ${gameId}.`);
      return;
    }

    // 3) For each BOT, place some influence bid
    for (const bot of botPlayers) {
      // Suppose each bot randomly bids between 0 and DEFAULT INFLUNCE
      const influenceMax = DEFAULT_INFLUENCE;
      const randomBid = this.aiBotService.randomInRange(0, influenceMax);

      // 4) Insert the vote just like a human would do via your service
      //    (mirroring the data shape: { influence, InfluenceRound, Player, submissionStamp })
      try {
        await this.prisma.influenceVote.create({
          data: {
            influence: randomBid,
            // Link the correct round
            InfluenceRound: { connect: { id: influenceRound.id } },
            // Link the bot
            Player: { connect: { id: bot.id } },
            submissionStamp: new Date(), // or however you set submissionStamp
          },
        });

        console.log(
          `Bot [${bot.nickname}] bids ${randomBid} influence in InfluenceRound ${influenceRound.id}.`,
        );
      } catch (error) {
        console.error(
          `Failed creating influence vote for bot [${bot.nickname}]:`,
          error,
        );
      }
    }
  }

  /**
   * 2) SET_COMPANY_IPO_PRICES
   *    Example: Each bot picks an IPO price for newly formed companies.
   */
  /**
   * 2) SET_COMPANY_IPO_PRICES
   *    Each bot picks an IPO price for newly formed companies the same way a human would.
   */
  private async botHandleSetCompanyIpoPrices(gameId: string): Promise<void> {
    // 1) Get BOT players
    const botPlayers = await this.aiBotService.getBotPlayers(gameId);
    if (!botPlayers.length) return;

    // 2) Find unpriced, inactive companies
    const unpricedCompanies = await this.prisma.company.findMany({
      where: {
        gameId,
        ipoAndFloatPrice: null,
        status: CompanyStatus.INACTIVE,
      },
    });
    if (!unpricedCompanies.length) return;

    // 3) Collect all sectorIds from those companies
    const sectorIds = [...new Set(unpricedCompanies.map((c) => c.sectorId))];

    // 4) Fetch all relevant sectors once
    const sectors = await this.prisma.sector.findMany({
      where: { id: { in: sectorIds } },
    });
    // Build a quick lookup map from sectorId -> sector object
    const sectorMap = new Map<string, Sector>();
    for (const s of sectors) {
      sectorMap.set(s.id, s);
    }

    // 5) Build a list of promises for parallel execution
    const promises: Promise<any>[] = [];

    for (const bot of botPlayers) {
      for (const company of unpricedCompanies) {
        const sector = sectorMap.get(company.sectorId);
        if (!sector) continue;

        // Filter stockGridPrices by the sector's ipoMin/ipoMax
        const companyIpoPrices = stockGridPrices.filter(
          (price) => price >= sector.ipoMin && price <= sector.ipoMax,
        );
        if (!companyIpoPrices.length) continue;

        // Pick a random price
        const randomIndex = this.aiBotService.randomInRange(
          0,
          companyIpoPrices.length - 1,
        );
        const chosenPrice = companyIpoPrices[randomIndex];

        // Create the vote promise
        const votePromise = this.createIpoVote({
          playerId: bot.id,
          companyId: company.id,
          ipoPrice: chosenPrice,
        }).then(() => {
          console.log(
            `Bot [${bot.nickname}] sets IPO price = ${chosenPrice} for ${company.name}.`,
          );
        });

        promises.push(votePromise);
      }
    }

    // 6) Execute all promises in parallel
    await Promise.all(promises);
  }

  /**
   * 4) STOCK_ACTION_ORDER
   *    Example: Each bot decides to place buy/sell orders during the stock round.
   */
  /**
   * STOCK_ACTION_ORDER
   *
   * The bot will only create "Market Buy" orders—no limit, no short, no option.
   */
  private async botHandleStockActionOrder(
    gameId: string,
    phase: Phase,
  ): Promise<void> {
    // 1) Gather bot players + relevant companies
    const botPlayers = await this.aiBotService.getBotPlayersWithShares(gameId);
    if (!botPlayers.length) return;

    const companies = await this.companyService.companiesWithRelations({
      where: {
        gameId,
        status: { in: [CompanyStatus.ACTIVE, CompanyStatus.INACTIVE] },
      },
    });
    if (!companies.length) return;

    // Build a share-availability map (IPO + OPEN_MARKET) for each company
    const shareAvailability = new Map<
      string,
      { ipoCount: number; omCount: number }
    >();
    for (const c of companies) {
      const ipoCount = c.Share.filter(
        (s) => s.location === ShareLocation.IPO,
      ).length;
      const omCount = c.Share.filter(
        (s) => s.location === ShareLocation.OPEN_MARKET,
      ).length;
      shareAvailability.set(c.id, { ipoCount, omCount });
    }

    // We'll store all buy/sell promises here
    const allActions: Promise<void>[] = [];

    const subRoundId = phase.stockSubRoundId;
    if (!subRoundId) {
      throw new Error('No sub round found');
    }
    //get sub round
    const stockSubRound = await this.stockSubRoundService.stockSubRound({
      id: subRoundId,
    });
    if (!stockSubRound) {
      throw new Error('Stock sub round not found');
    }
    if (stockSubRound.roundNumber >= 3) {
      //we return as no bot will act
      return;
    }
    const botOddsToAct =
      stockSubRound.roundNumber === 1
        ? 0.9
        : stockSubRound.roundNumber === 2
          ? 0.7
          : 0.5;
    // 2) For each bot, decide how many actions (0..3)
    for (const bot of botPlayers) {
      const companiesSoldThisTurn = new Set<string>();

      const botWillPlaceOrder = Math.random() < botOddsToAct;

      if (!botWillPlaceOrder) {
        console.log(`Bot [${bot.nickname}] decides to skip stock action.`);
        continue;
      }

      let doBuy = Math.random() < 0.7;

      // if the bot is at 60% in all companies, skip buy
      if (this.aiBotService.isAt60PercentForAllCompanies(bot, companies)) {
        doBuy = false; // forced sells, or do nothing
      }

      // if the bot has zero shares to sell, no sense in "sell"
      const hasSharesToSell = bot.Share.some(
        (s) => s.location === ShareLocation.PLAYER,
      );
      if (!hasSharesToSell && !doBuy) {
        console.log(
          `Bot [${bot.nickname}] has no shares but wants to sell => skip action`,
        );
        continue;
      }

      if (doBuy) {
        const buyPromise = this.aiBotService.buildBuyAction(
          bot,
          companies,
          shareAvailability,
          companiesSoldThisTurn,
          gameId,
          this.placeBuyOrder.bind(this),
        );
        if (buyPromise) allActions.push(buyPromise);
      } else {
        const sellPromise = this.aiBotService.buildSellAction(
          bot,
          companies,
          companiesSoldThisTurn,
          gameId,
          this.placeSellOrder.bind(this),
        );
        if (sellPromise) allActions.push(sellPromise);
      }
    }

    // 4) Execute all actions in parallel
    await Promise.all(allActions);
  }

  // --------------------------------------------------------------------------
  // Actually place the buy order (like humans). Subtract action counter, etc.
  private async placeBuyOrder(
    bot: PlayerWithShares,
    company: CompanyWithRelations,
    quantity: number,
    location: ShareLocation,
    gameId: string,
  ) {
    const order = await this.createPlayerOrder({
      playerId: bot.id,
      companyId: company.id,
      orderType: OrderType.MARKET,
      location,
      quantity,
      value: 0, // market
      isSell: false,
      orderStatus: OrderStatus.PENDING,
      gameId,
      submissionStamp: new Date(),
    });

    // Subtract from action counter
    await this.playersService.subtractActionCounter(bot.id, order.orderType);

    console.log(
      `Bot [${bot.nickname}] BUY x${quantity} of ${company.name} from ${location}.`,
    );
  }

  // --------------------------------------------------------------------------
  // Place the SELL order similarly
  private async placeSellOrder(
    bot: PlayerWithShares,
    company: CompanyWithRelations,
    quantity: number,
    gameId: string,
  ) {
    const order = await this.createPlayerOrder({
      playerId: bot.id,
      companyId: company.id,
      orderType: OrderType.MARKET,
      location: ShareLocation.PLAYER,
      quantity,
      value: 0, // market
      isSell: true,
      orderStatus: OrderStatus.PENDING,
      gameId,
      submissionStamp: new Date(),
    });

    await this.playersService.subtractActionCounter(bot.id, order.orderType);

    console.log(`Bot [${bot.nickname}] SELL x${quantity} of ${company.name}.`);
  }
  /**
   * 7) OPERATING_PRODUCTION_VOTE
   *    Each bot decides how to vote for distribution of revenue:
   *    e.g. FULL DIVIDEND, FIFTY-FIFTY, or RETAINED, etc.
   */
  /**
   * OPERATING_PRODUCTION_VOTE
   *
   * Each bot will fetch the same OperatingRound + ProductionResults
   * that humans see, then cast a RevenueDistribution vote.
   */
  private async botHandleOperatingProductionVote(
    gameId: string,
  ): Promise<void> {
    // 1) Grab bot players
    const botPlayers = await this.aiBotService.getBotPlayers(gameId);
    if (!botPlayers.length) return;

    // 2) Get current phase with an operatingRoundId
    const currentPhase = await this.phaseService.currentPhase(gameId);
    if (!currentPhase?.operatingRoundId) {
      console.log(`No operatingRoundId found for phase in gameId=${gameId}.`);
      return;
    }

    // 3) Fetch the operating round + production results
    const operatingRound =
      await this.operatingRoundService.operatingRoundWithProductionResults({
        id: currentPhase.operatingRoundId,
      });
    if (!operatingRound) {
      console.log(
        `No operating round found for id=${currentPhase.operatingRoundId}.`,
      );
      return;
    }
    if (!operatingRound.productionResults?.length) {
      console.log(
        `No production results found in operating round=${operatingRound.id}.`,
      );
      return;
    }

    // We'll collect all votes in an array of promises for parallel execution
    const votePromises: Promise<void>[] = [];

    // 4) For each bot, for each ProductionResult, pick the distribution + create vote promise
    for (const bot of botPlayers) {
      for (const result of operatingRound.productionResults) {
        // only ACTIVE companies
        if (result.Company?.status !== CompanyStatus.ACTIVE) continue;

        // a) Decide distribution based on company cash
        //    e.g. if result.Company.cashOnHand < 80 => RETAINED
        //    or < 150 => FIFTY_FIFTY, else FULL
        let chosenDistribution: RevenueDistribution;

        const companyCash = result.Company.cashOnHand || 0;
        if (companyCash < 80) {
          chosenDistribution = RevenueDistribution.RETAINED;
        } else if (companyCash < 150) {
          chosenDistribution = RevenueDistribution.DIVIDEND_FIFTY_FIFTY;
        } else {
          chosenDistribution = RevenueDistribution.DIVIDEND_FULL;
        }

        // b) Build a promise for the vote
        const votePromise = (async () => {
          try {
            await this.revenueDistributionVoteService.createRevenueDistributionVote(
              {
                OperatingRound: { connect: { id: operatingRound.id } },
                ProductionResult: { connect: { id: result.id } },
                Player: { connect: { id: bot.id } },
                Company: { connect: { id: result.companyId } },
                revenueDistribution: chosenDistribution,
              },
            );

            console.log(
              `Bot [${bot.nickname}] voted ${chosenDistribution} for Company ${result.Company?.name}.`,
            );
          } catch (error) {
            console.error(
              `Bot [${bot.nickname}] failed to cast vote for ProductionResult=${result.id}:`,
              error,
            );
          }
        })();

        // c) Push promise into the array
        votePromises.push(votePromise);
      }
    }

    // 5) Execute all votes in parallel
    await Promise.all(votePromises);
  }

  /**
   * 8) OPERATING_ACTION_COMPANY_VOTE
   *    Each bot decides which action (OperatingRoundAction)
   *    the company should take.
   */
  private async botHandleOperatingActionCompanyVote(
    gameId: string,
  ): Promise<void> {
    // 1) Get the current phase to see if there is a companyId/operatingRoundId
    const currentPhase = await this.phaseService.currentPhase(gameId);
    if (
      !currentPhase ||
      currentPhase.name !== PhaseName.OPERATING_ACTION_COMPANY_VOTE
    ) {
      console.log(
        `No valid operating-action-company-vote phase found for gameId=${gameId}.`,
      );
      return;
    }
    if (!currentPhase.companyId || !currentPhase.operatingRoundId) {
      console.log(
        `Phase is missing companyId or operatingRoundId, cannot place votes.`,
      );
      return;
    }

    // 2) Fetch the target company
    const company = await this.companyService.companyWithRelations({
      id: currentPhase.companyId,
    });
    if (!company) {
      console.log(`Company not found for id=${currentPhase.companyId}.`);
      throw new Error('Company not found');
    }

    // 3) Get all bots
    const botPlayers = await this.aiBotService.getBotPlayers(gameId);
    if (!botPlayers.length) return;

    // 4) Define possible actions
    const possibleActions = [
      OperatingRoundAction.VETO,
      OperatingRoundAction.EXPANSION,
      OperatingRoundAction.MARKETING_SMALL_CAMPAIGN,
      OperatingRoundAction.MARKETING,
      OperatingRoundAction.OUTSOURCE,
      OperatingRoundAction.LOAN,
      OperatingRoundAction.DOWNSIZE,
      OperatingRoundAction.SPEND_PRESTIGE,
      OperatingRoundAction.INCREASE_PRICE,
      OperatingRoundAction.DECREASE_PRICE,
      OperatingRoundAction.MERGE,
      OperatingRoundAction.RESEARCH,
      OperatingRoundAction.SHARE_BUYBACK,
      OperatingRoundAction.SHARE_ISSUE,
      OperatingRoundAction.LOBBY,
      OperatingRoundAction.LICENSING_AGREEMENT,
    ];

    // 5) Calculate supply/demand for the company
    const companyDemand = calculateDemand(
      company.demandScore,
      company.baseDemand,
    );
    const companySupply = calculateCompanySupply(
      company.supplyMax,
      company.supplyBase,
      company.supplyCurrent,
    );

    // 6) Filter out actions the company cannot afford or that would reduce cash below 1
    //    We'll assume you have a function getCompanyActionCost(...) that returns the cost.
    //    If the cost >= company.cashOnHand, we skip it.
    const affordableActions = possibleActions.filter((action) => {
      // Each action might have a cost that depends on company.currentStockPrice or other logic
      const cost = getCompanyActionCost(action, company.currentStockPrice || 0);

      // Skip if cost is undefined or the cost >= company.cashOnHand
      // so we don't bring the company's cash to negative or 0
      if (cost === undefined || cost >= company.cashOnHand) {
        return false;
      }

      return true;
    });

    if (!affordableActions.length) {
      console.log(
        `Company [${company.name}] cannot afford any actions. Bots may vote VETO or do nothing.`,
      );
      // If literally no actions are affordable, we might fallback to VETO:
      affordableActions.push(OperatingRoundAction.VETO);
    }

    // 7) Decide on a final action to vote for based on supply/demand priorities
    //    We'll define a small helper function:
    const pickFinalAction = (): OperatingRoundAction => {
      // If supply <= 1 and OUTSOURCE is in the list, pick it
      if (
        companySupply <= 1 &&
        affordableActions.includes(OperatingRoundAction.OUTSOURCE)
      ) {
        return OperatingRoundAction.OUTSOURCE;
      }

      // If demand <= 1 and MARKETING_SMALL_CAMPAIGN is in the list, pick it
      if (
        companyDemand <= 1 &&
        affordableActions.includes(
          OperatingRoundAction.MARKETING_SMALL_CAMPAIGN,
        )
      ) {
        return OperatingRoundAction.MARKETING_SMALL_CAMPAIGN;
      }

      // Otherwise pick a random from the filtered list
      const randomIndex = this.aiBotService.randomInRange(
        0,
        affordableActions.length - 1,
      );
      return affordableActions[randomIndex];
    };

    // Example of how to build an array of promises in a loop
    // and then await them all at once.

    const votePromises: Promise<void>[] = [];

    if (!currentPhase.operatingRoundId) {
      console.error('No operating round found for phase.');
      return;
    }

    if (!currentPhase.companyId) {
      console.error('No company found for phase.');
      return;
    }
    for (const bot of botPlayers) {
      const finalAction = pickFinalAction();

      // Build a promise for this bot's vote
      const votePromise = (async () => {
        try {
          await this.operatingRoundVoteService.createOperatingRoundVote({
            OperatingRound: {
              connect: { id: currentPhase.operatingRoundId || '' },
            },
            Player: { connect: { id: bot.id } },
            Company: { connect: { id: currentPhase.companyId || '' } },
            actionVoted: finalAction,
            submissionStamp: new Date(), // or some context submission time
          });

          console.log(
            `Bot [${bot.nickname}] votes for "${finalAction}" on ` +
              `companyId=${currentPhase.companyId}.`,
          );
        } catch (error) {
          console.error(
            `Bot [${bot.nickname}] failed to cast operating action vote for "${finalAction}":`,
            error,
          );
        }
      })();

      // Add the promise to the array
      votePromises.push(votePromise);
    }

    // Finally, await them in parallel
    await Promise.all(votePromises);
  }
}
