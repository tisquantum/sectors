import { Injectable } from '@nestjs/common';
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
} from '@prisma/client';
import { GamesService } from '@server/games/games.service';
import { CompanyService } from '@server/company/company.service';
import { SectorService } from '@server/sector/sector.service';
import { gameDataJson } from '@server/data/gameData';
import { StartGameInput } from './game-management.interface';
import {
  CompanyActionWithCompany,
  CompanyWithSector,
  GameState,
  GameTurnWithRelations,
  OptionContractWithRelations,
  PlayerOrderWithCompany,
  PlayerOrderWithPlayerCompany,
  PlayerOrderWithPlayerCompanySectorShortOrder,
  PlayerWithShares,
  ProductionResultWithCompany,
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
} from '@server/data/constants';
import { TimerService } from '@server/timer/timer.service';
import {
  calculateCertLimitForPlayerCount,
  calculateCompanySupply,
  calculateDemand,
  calculateMarginAccountMinimum,
  calculateNetWorth,
  calculateStepsAndRemainder,
  calculateStepsToNewTier,
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
} from '@server/data/helpers';
import { PusherService } from 'nestjs-pusher';
import {
  EVENT_GAME_ENDED,
  EVENT_NEW_PHASE,
  getGameChannelId,
} from '@server/pusher/pusher.types';
import { OperatingRoundService } from '@server/operating-round/operating-round.service';
import { ShareService } from '@server/share/share.service';
import { PlayerOrderService } from '@server/player-order/player-order.service';
import e from 'express';
import { StockHistoryService } from '@server/stock-history/stock-history.service';
import { ProductionResultService } from '@server/production-result/production-result.service';
import { CompanyActionService } from '@server/company-action/company-action.service';
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
  async handlePhase(phase: Phase) {
    switch (phase.name) {
      case PhaseName.START_TURN:
        await this.determinePriorityOrderBasedOnNetWorth(phase);
        await this.handleOpeningNewCompany(phase);
        break;
      case PhaseName.INFLUENCE_BID_RESOLVE:
        await this.resolveInfluenceBid(phase);
        break;
      case PhaseName.STOCK_RESOLVE_LIMIT_ORDER:
        await this.resolveLimitOrders(phase);
        break;
      case PhaseName.STOCK_OPEN_LIMIT_ORDERS:
        await this.openLimitOrders(phase);
        break;
      case PhaseName.STOCK_ACTION_RESULT:
        await this.handleNewSubStockActionRound(phase);
        break;
      case PhaseName.STOCK_ACTION_REVEAL:
        await this.handleStockActionReveal(phase);
        break;
      case PhaseName.STOCK_RESOLVE_MARKET_ORDER:
        //resolve stock round
        await this.resolveMarketOrders(phase);
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
      case PhaseName.OPERATING_PRODUCTION:
        await this.resolveOperatingProduction(phase);
        break;
      case PhaseName.OPERATING_PRODUCTION_VOTE_RESOLVE:
        await this.resolveOperatingProductionVotes(phase);
        break;
      case PhaseName.OPERATING_STOCK_PRICE_ADJUSTMENT:
        console.log('Adjusting stock prices', phase);
        await this.adjustStockPrices(phase);
        //TODO: Why is this necessary?
        //await this.createOperatingRoundCompanyActions(phase);
        await this.decrementSectorDemandBonus(phase);
        break;
      case PhaseName.OPERATING_ACTION_COMPANY_VOTE_RESULT:
        await this.resolveCompanyVotes(phase);
        break;
      case PhaseName.OPERATING_COMPANY_VOTE_RESOLVE:
        await this.resolveCompanyAction(phase);
        break;
      case PhaseName.CAPITAL_GAINS:
        await this.resolveCapitalGains(phase);
        break;
      case PhaseName.DIVESTMENT:
        await this.resolveDivestment(phase);
        break;
      case PhaseName.END_TURN:
        await this.adjustEconomyScore(phase);
        await this.resolveCompanyLoans(phase);
        await this.optionContractGenerate(phase);
        const isEndGame = await this.checkAndTriggerEndGame(phase);
        if (!isEndGame) {
          await this.resolveEndTurn(phase);
        }
        break;
      default:
        return;
    }
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

    // Create player results
    const playerResults = players.map((player, index) => {
      const placementData = placements.find((p) => p.index === index)!;
      return {
        gameRecordId: gameRecord.id,
        playerId: player.id,
        userId: player.userId,
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
   * Every third turn, look for the sector with the top two performing companies.
   * Performance is measured based on the company's stock price.  If there are no sectors with at least
   * two active companies, we instead look for the top performing company.  If there are zero companies active, we skip this.
   *
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

    // Get all active companies and group by sector
    const companies = await this.companyService.companiesWithSector({
      where: { gameId: phase.gameId, status: CompanyStatus.ACTIVE },
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

    // Filter out sectors with fewer than 2 companies
    const sectorsWithAtLeastTwoCompanies = Object.entries(
      groupedCompanies,
    ).filter(([, companies]) => companies.length >= 2);

    // If no sector has two companies, prioritize sectors with one company
    if (sectorsWithAtLeastTwoCompanies.length === 0) {
      const sectorsWithOneCompany = Object.entries(groupedCompanies).filter(
        ([, companies]) => companies.length === 1,
      );

      if (sectorsWithOneCompany.length === 0) {
        return; // No eligible sectors for new company creation
      }

      // Find the sector with the highest stock price among the single-company sectors
      const highestSingleCompanySector = sectorsWithOneCompany.reduce(
        (highest, [sectorId, companies]) => {
          const company = companies[0];
          if (
            !highest ||
            company.currentStockPrice > highest.company.currentStockPrice
          ) {
            return { sectorId, company };
          }
          return highest;
        },
        null as { sectorId: string; company: CompanyWithSector } | null,
      );

      if (highestSingleCompanySector) {
        return this.createCompanyInSector(
          phase,
          highestSingleCompanySector.sectorId,
          [highestSingleCompanySector.company],
        );
      }

      return;
    }

    // Combine the stock prices for the top two stock price companies per sector
    const sectorTopCompanies = sectorsWithAtLeastTwoCompanies.map(
      ([sectorId, companies]) => {
        const sortedCompanies = companies.sort(
          (a, b) => b.currentStockPrice - a.currentStockPrice,
        );
        return {
          sectorId,
          combinedStockPrice:
            sortedCompanies[0].currentStockPrice +
            sortedCompanies[1].currentStockPrice,
          topCompanies: sortedCompanies.slice(0, 2),
        };
      },
    );

    // Get the sector with the highest combined stock price
    const topSector = sectorTopCompanies.reduce((prev, curr) => {
      return curr.combinedStockPrice > prev.combinedStockPrice ? curr : prev;
    });

    // Create a new company in this sector
    return this.createCompanyInSector(
      phase,
      topSector.sectorId,
      topSector.topCompanies,
    );
  }

  /**
   * Helper function to create a company in a specific sector
   */
  private async createCompanyInSector(
    phase: Phase,
    sectorId: string,
    sectorCompanies: CompanyWithSector[],
  ) {
    const sector = await this.sectorService.sector({ id: sectorId });
    if (!sector) {
      throw new Error('Sector not found');
    }

    const newCompanyInfo = getRandomCompany(sector.sectorName);
    const ipoPrice = determineFloatPrice(sector);
    const stockTier = determineStockTier(ipoPrice);
    const newCompany = await this.companyService.createCompany({
      Game: { connect: { id: phase.gameId } },
      Sector: { connect: { id: sectorId } },
      status: CompanyStatus.INACTIVE,
      currentStockPrice: ipoPrice,
      companyTier: CompanyTier.ESTABLISHED,
      name: newCompanyInfo.name,
      stockSymbol: newCompanyInfo.symbol,
      unitPrice: Math.floor(
        Math.random() * (sector.unitPriceMax - sector.unitPriceMin + 1) +
          sector.unitPriceMin,
      ),
      throughput: 0,
      ipoAndFloatPrice: ipoPrice,
      stockTier,
      demandScore: 0,
      baseDemand: 0,
      supplyCurrent: 0,
      supplyMax: CompanyTierData[CompanyTier.ESTABLISHED].supplyMax,
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

    await this.gameLogService.createGameLog({
      game: { connect: { id: phase.gameId } },
      content: `A new company ${newCompany.name} has been established in the ${sector.sectorName} sector.`,
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
        company.cashOnHand - LOAN_AMOUNT * LOAN_INTEREST_RATE,
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

    const [gameTurn, players] = await Promise.all([
      gameTurnPromise,
      playersPromise,
    ]);

    if (!gameTurn) {
      throw new Error('Game turn not found');
    }

    if (gameTurn.turn === 1) {
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
      where: { gameId: phase.gameId, isFloated: true },
    });

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
  async resolveInfluenceBid(phase: Phase) {
    //get the game
    const game = await this.gamesService.game({ id: phase.gameId });
    if (!game) {
      throw new Error('Game not found');
    }
    //get the influence round
    const influenceRoundWithVotes =
      await this.influenceRoundService.getInfluenceRound({
        id: phase.influenceRoundId || 0,
      });
    if (!influenceRoundWithVotes) {
      throw new Error('Influence round not found');
    }
    //sort the votes in descending order
    const sortedVotes = influenceRoundWithVotes.InfluenceVotes.sort(
      (a, b) => b.influence - a.influence,
    );
    //create player priority for the turn
    const playerPriority = sortedVotes.map((vote, index) => {
      return {
        playerId: vote.playerId,
        priority: index + 1,
        influence: vote.influence,
        gameTurnId: phase.gameTurnId,
      };
    });
    //get all players in the game
    const players = await this.playersService.players({
      where: { gameId: game.id },
    });
    //if there are any missing players from the playerPriority, add them
    const missingPlayers = players.filter(
      (player) =>
        !playerPriority.find((priority) => priority.playerId === player.id),
    );
    const missingPlayerPriority = missingPlayers.map((player) => {
      return {
        playerId: player.id,
        priority: playerPriority.length + 1,
        influence: 0,
        gameTurnId: phase.gameTurnId,
      };
    });
    //create the player priority
    const allPlayerPriority = [...playerPriority, ...missingPlayerPriority];
    const gameLogMessages: Prisma.GameLogCreateManyInput[] = [];
    //create game logs
    allPlayerPriority.forEach(async (priority) => {
      const player = await this.playersService.player({
        id: priority.playerId,
      });
      if (!player) {
        throw new Error('Player not found');
      }
      gameLogMessages.push({
        gameId: phase.gameId,
        content: `Player ${player.nickname} has a priority of ${
          priority.priority
        } with ${priority.influence} influence. They earned a total of $${
          influenceRoundWithVotes.maxInfluence - priority.influence
        } for unspent influence.`,
      });
    });
    try {
      await this.gameLogService.createManyGameLogs(gameLogMessages);
    } catch (error) {
      console.error('Error creating game logs', error);
    }
    const playerPriorityAddMany = allPlayerPriority.map((priority) => {
      //remove influence from object
      const { influence, ...rest } = priority;
      return rest;
    });

    try {
      await this.playerPriorityService.createManyPlayerPriorities(
        playerPriorityAddMany,
      );
    } catch (error) {
      console.error('Error creating player priority', error);
    }
    //give players money for unspent priority
    const playerPriorityUnspent = allPlayerPriority.filter(
      (priority) => priority.influence < influenceRoundWithVotes.maxInfluence,
    );
    const playerPriorityUnspentMoney = playerPriorityUnspent.map((priority) => {
      return {
        playerId: priority.playerId,
        amount: influenceRoundWithVotes.maxInfluence - priority.influence,
        gameTurnId: phase.gameTurnId,
      };
    });
    const playerPriorityUnspentPromises = playerPriorityUnspentMoney.map(
      async (money) => {
        await this.playerAddMoney(
          phase.gameId,
          phase.gameTurnId,
          phase.id,
          money.playerId,
          money.amount,
          EntityType.BANK,
          `Unspent influence.`,
        );
      },
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
        await this.transactionService.createTransactionEntityToEntity({
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
        });
      });

      const sellPromises = sharesToDivest.map((share) => async () => {
        const sharePrice = share.Company.currentStockPrice || 0;
        await this.playerAddMoney(
          share.gameId,
          phase.gameTurnId,
          phase.id,
          player.id,
          sharePrice,
          EntityType.BANK,
          `Divestment of ${share.Company.name} share.`,
        );
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
        content: `Stock price for ${
          sharesToDivest[0].Company.name
        } has decreased to $${stockPrice.price.toFixed(
          2,
        )} by ${netDifference} steps due to market sell orders during DIVESTMENT`,
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
  async resolveCapitalGains(phase: Phase) {
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

  async createOperatingRoundCompanyActions(phase: Phase) {
    const operatingRound =
      await this.operatingRoundService.operatingRoundWithProductionResults({
        id: phase.operatingRoundId || 0,
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
        operatingRoundId: phase.operatingRoundId || 0,
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
        operatingRoundId: phase.operatingRoundId || 0,
      }));

    if (companyActions.length === 0) {
      console.log('No new company actions to create');
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
    const operatingRound =
      await this.operatingRoundService.operatingRoundWithProductionResults({
        id: phase.operatingRoundId || 0,
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
              console.error('Player not found');
              return;
            }
            const dividendTotal = Math.floor(dividend * shares.length);
            await this.playersService.updatePlayer({
              where: { id: player.id },
              data: { cashOnHand: player.cashOnHand + dividendTotal },
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

  async handleStockActionReveal(phase: Phase) {
    try {
      await this.playerOrderService.updateManyPlayerOrders({
        where: {
          stockRoundId: phase.stockRoundId || 0,
        },
        data: {
          isConcealed: false,
        },
      });
    } catch (error) {
      console.error('Error revealing stock actions', error);
    }
  }

  async handleNewSubStockActionRound(phase: Phase) {
    //get the stock round
    const stockRound = await this.stockRoundService.stockRound({
      id: phase.stockRoundId || 0,
    });
    if (!stockRound) {
      throw new Error('Stock round not found');
    }
    //increment the sub round
    await this.stockRoundService.updateStockRound({
      where: { id: stockRound.id },
      data: { stockActionSubRound: stockRound.stockActionSubRound + 1 },
    });
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
    // Get the company action(s)
    let companyActions = await this.prisma.companyAction.findMany({
      where: {
        operatingRoundId: phase.operatingRoundId || 0,
        companyId: phase.companyId || '',
      },
      include: {
        Company: true,
      },
    });
    // If no company actions exist, create a VETO action
    if (companyActions.length === 0) {
      const newCompanyAction =
        await this.companyActionService.createCompanyAction({
          Company: { connect: { id: phase.companyId || '' } },
          OperatingRound: { connect: { id: phase.operatingRoundId || 0 } },
          action: OperatingRoundAction.VETO,
          resolved: true,
        });

      companyActions.push(newCompanyAction);
    }

    console.log('companyActions', companyActions);

    for (let companyAction of companyActions) {
      if (!companyAction.action) {
        console.log('Company action has no action, setting to VETO');
        companyAction = await this.companyActionService.updateCompanyAction({
          where: { id: companyAction.id },
          data: { action: OperatingRoundAction.VETO },
        });
      }

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

      // Mark the company action as resolved
      await this.companyActionService.updateCompanyAction({
        where: { id: companyAction.id },
        data: { resolved: true },
      });

      // Handle the specific company action
      switch (companyAction.action) {
        case OperatingRoundAction.SHARE_ISSUE:
          await this.resolveIssueShares(companyAction);
          break;
        case OperatingRoundAction.MARKETING:
          await this.resolveMarketingAction(companyAction);
          break;
        case OperatingRoundAction.MARKETING_SMALL_CAMPAIGN:
          await this.resolveMarketingSmallCampaignAction(companyAction);
          break;
        case OperatingRoundAction.SHARE_BUYBACK:
          await this.resolveShareBuyback(companyAction);
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
          break;
        case OperatingRoundAction.LOAN:
          await this.companyLoan(companyAction);
          break;
        case OperatingRoundAction.LOBBY:
          await this.lobbyCompany(companyAction);
          break;
        case OperatingRoundAction.VETO:
          console.log('VETO action encountered');
          break;
        default:
          console.warn(`Unknown action encountered: ${companyAction.action}`);
          break;
      }
    }
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
    //filter cards from the deck that do not have a company id
    const cards = researchDeck.cards.filter((card) => !card.companyId);
    //pick a random card
    const card = cards[Math.floor(Math.random() * cards.length)];
    //assign this card to the company
    await this.cardsService.updateCard(card.id, {
      Company: { connect: { id: company.id } },
    });
    //trigger effect
    await this.triggerCardEffect(card.effect, company);
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
      company.currentStockPrice,
      1,
      StockAction.RESEARCH_EFFECT,
    );
  }

  async companySupplyIncreaseEffect(company: Company) {
    //increate the company supply max by 1
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
      where: { sectorId: company.sectorId, id: { not: company.id } },
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
        otherCompany.currentStockPrice,
        1,
        StockAction.PRESTIGE_REWARD,
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
      company.currentStockPrice,
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

  async resolveShareBuyback(companyAction: CompanyAction) {
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
      return;
    }
    //destroy the share
    await this.shareService.deleteShare({ id: share.id });
    //update the company cash on hand
    await this.companyService.updateCompany({
      where: { id: company.id },
      data: { cashOnHand: company.cashOnHand + share.price },
    });
  }

  async payForCompanyAction(companyAction: CompanyAction) {
    //get the company
    const company = await this.companyService.company({
      id: companyAction.companyId,
    });
    if (!company) {
      throw new Error('Company not found');
    }
    console.log('companyAction', companyAction);
    if (!companyAction.action) {
      throw new Error('Action not found');
    }
    console.log('companyAction', companyAction);
    //get the cost of the action
    const cost = CompanyActionCosts[companyAction.action];

    if (cost === undefined || cost === null) {
      throw new Error('Cost not found');
    }
    //check if the company has enough cash on hand
    if (company.cashOnHand < cost) {
      throw new Error('Company does not have enough cash on hand');
    }
    //update the company cash on hand NOTE: this money does not go back to the bank.
    await this.companyService.updateCompany({
      where: { id: company.id },
      data: { cashOnHand: company.cashOnHand - cost },
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
        data: { consumers: sector.consumers + MARKETING_CONSUMER_BONUS },
      });
      //subtract consumers from game
      await this.gamesService.updateGameState({
        where: { id: game.id },
        data: {
          consumerPoolNumber:
            game.consumerPoolNumber - MARKETING_CONSUMER_BONUS,
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
    const operatingRound =
      await this.operatingRoundService.operatingRoundWithProductionResults({
        id: phase.operatingRoundId || 0,
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

      switch (revenueDistribution) {
        case RevenueDistribution.DIVIDEND_FULL:
          steps = calculateStepsToNewTier(revenue, company.currentStockPrice);
          newStockPrice = getStockPriceStepsUp(
            company.currentStockPrice,
            steps,
          );
          break;
        case RevenueDistribution.DIVIDEND_FIFTY_FIFTY:
          steps = calculateStepsToNewTier(
            Math.floor(revenue / 2),
            company.currentStockPrice,
          );
          newStockPrice = getStockPriceStepsUp(
            company.currentStockPrice,
            steps,
          );
          break;
        case RevenueDistribution.RETAINED:
          newStockPrice = getStockPriceWithStepsDown(
            company.currentStockPrice,
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

    const operatingRound =
      await this.operatingRoundService.operatingRoundWithRevenueDistributionVotes(
        {
          id: phase.operatingRoundId || 0,
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
        productionResultsUpdates.push({
          where: {
            id: validVotes[0].productionResultId,
            operatingRoundId: phase.operatingRoundId || 0,
          },
          data: {
            revenueDistribution: maxVote as RevenueDistribution,
          },
        });
      }
    }

    // Perform bulk update
    await Promise.all(
      productionResultsUpdates.map((update) =>
        this.productionResultService.updateManyProductionResults(update),
      ),
    );
    try {
      await this.calculateAndDistributeDividends(phase);
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
  }): number {
    const totalSectorDemand =
      company.Sector.demand + (company.Sector.demandBonus || 0);
    const companySupply = calculateCompanySupply(
      company.supplyBase,
      company.supplyMax,
    );
    const throughput =
      calculateDemand(company.demandScore, company.baseDemand) +
      totalSectorDemand -
      companySupply;
    return throughput;
  }

  calculateThroughputByUnitsSold(
    unitsManufactured: number,
    unitsSold: number,
  ): number {
    return unitsManufactured - unitsSold;
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
    // Reduce company cash on hand by operating fees
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

      if (hasAutomationCard) {
        operatingCosts =
          operatingCosts - AUTOMATION_EFFECT_OPERATIONS_REDUCTION;
      }
      operatingCosts = Math.max(operatingCosts, 0);

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

    await this.transactionService.createManyTransactionsFromCollectedData(
      transactionDataCollection,
    );

    // Batch update companies' cashOnHand and statuses
    await this.companyService.updateManyCompanies(companyCashOnHandUpdates);

    // Log all game events in bulk
    await this.gameLogService.createManyGameLogs(gameLogs);

    // Filter out insolvent companies
    companies = companies.filter(
      (company) => company.status === CompanyStatus.ACTIVE,
    );

    // Group companies by sector
    const groupedCompanies = companies.reduce<{
      [key: string]: CompanyWithSector[];
    }>((acc, company) => {
      if (!acc[company.sectorId]) {
        acc[company.sectorId] = [];
      }
      acc[company.sectorId].push(company);
      return acc;
    }, {});

    const sectorRewards: { [sectorId: string]: number } = {};
    const companyUpdates = [];
    const productionResults = [];
    const stockPenalties = [];
    const stockRewards = [];
    const sectorConsumersUpdates = [];

    let globalConsumers = game.consumerPoolNumber;

    for (const [sectorId, sectorCompanies] of Object.entries(
      groupedCompanies,
    )) {
      const sector = await this.sectorService.sector({ id: sectorId });
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
        let unitsManufactured = calculateCompanySupply(
          company.supplyBase,
          company.supplyMax,
        );
        const maxCustomersAttracted =
          calculateDemand(company.demandScore, company.baseDemand) +
          sector.demand +
          (sector.demandBonus || 0);

        let unitsSold = Math.min(unitsManufactured, maxCustomersAttracted);
        if (unitsSold > consumers) {
          unitsSold = consumers;
        }

        const revenue = company.unitPrice * unitsSold;
        consumers -= unitsSold;
        globalConsumers += unitsSold;

        sectorConsumersUpdates.push({
          id: sectorId,
          consumers,
        });

        const throughput = this.calculateThroughputByUnitsSold(
          unitsManufactured,
          maxCustomersAttracted,
        );
        const throughputOutcome = throughputRewardOrPenalty(throughput);

        const companyUpdate = {
          id: company.id,
          demandScore: Math.max(company.demandScore - 1, 0),
          prestigeTokens: company.prestigeTokens || 0,
        };

        if (unitsSold >= unitsManufactured) {
          companyUpdate.prestigeTokens = (company.prestigeTokens || 0) + 1;
        }

        if (throughputOutcome.type === ThroughputRewardType.SECTOR_REWARD) {
          stockRewards.push({
            gameId: phase.gameId,
            companyId: company.id,
            phaseId: String(phase.id),
            currentStockPrice: company.currentStockPrice || 0,
            steps: 1,
          });
          gameLogs.push({
            gameId: phase.gameId,
            content: `Company ${company.name} has met optimal efficiency and has moved +1 on the stock chart.`,
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

        productionResults.push({
          revenue,
          companyId: company.id,
          operatingRoundId: phase.operatingRoundId || 0,
          throughputResult: throughput,
          steps: throughputOutcome.share_price_steps_down || 0,
        });

        companyUpdates.push(companyUpdate);
      }
    }

    // Batch update companies, production results, stock changes, and sectors
    await this.companyService.updateManyCompanies(companyUpdates);
    await this.productionResultService.createManyProductionResults(
      productionResults,
    );
    await this.processStockChanges(stockPenalties, stockRewards);
    await this.sectorService.updateMany(sectorConsumersUpdates);
    await this.gamesService.updateGame({
      where: { id: phase.gameId },
      data: { consumerPoolNumber: globalConsumers },
    });

    // Log all game events
    await this.gameLogService.createManyGameLogs(gameLogs);
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
    // Process stock penalties
    for (const penalty of stockPenalties) {
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
    }

    // Process stock rewards
    for (const reward of stockRewards) {
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
    }
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
      throw new Error('Player not found');
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
        contribution.shareContribution * company.currentStockPrice,
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
  }
  /**
   * Resolve the company votes, if there is a tie, we take priority in the vote priority order.
   * If the company is insolvent, we instead resolve cash contributions.
   *
   * @param phase
   */
  async resolveCompanyVotes(phase: Phase) {
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
          acc + contribution.shareContribution * company.currentStockPrice,
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
        await this.gameLogService.createGameLog({
          game: { connect: { id: phase.gameId } },
          content: `Company ${company.name} has recovered from insolvency.`,
        });
      } else {
        await this.gameLogService.createGameLog({
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
              updatedCompany.currentStockPrice * 0.2,
            );
            this.shareService.deleteShare({ id: share.id });
            if (share.playerId) {
              return this.playerAddMoney(
                phase.gameId,
                phase.gameTurnId,
                phase.id,
                share.playerId,
                shareLiquidationValue,
                EntityType.BANK,
                'Company liquidation',
              );
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

      await this.gameLogService.createGameLog({
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

      // Collect votes in one query
      const votes = await this.prisma.operatingRoundVote.findMany({
        where: {
          companyId: company.id,
          operatingRoundId: phase.operatingRoundId || 0,
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

      const sortedActions = Object.entries(actionVotes)
        .sort(([, aVotes], [, bVotes]) => (bVotes || 0) - (aVotes || 0))
        .slice(0, companyActionCount)
        .map(([action]) => action as OperatingRoundAction);

      // Fill remaining actions with VETO if needed
      while (sortedActions.length < companyActionCount) {
        sortedActions.push(OperatingRoundAction.VETO);
      }

      // Handle company actions in a batch manner
      const existingActions = await this.companyActionService.companyActions({
        where: {
          companyId: company.id,
          operatingRoundId: phase.operatingRoundId || 0,
        },
      });

      const existingActionMap = new Map(
        existingActions.map((action) => [action.action, action]),
      );

      for (const resolvedAction of sortedActions) {
        const existingAction = existingActionMap.get(resolvedAction);

        if (!existingAction) {
          await this.companyActionService.createCompanyAction({
            action: resolvedAction,
            Company: { connect: { id: company.id } },
            OperatingRound: { connect: { id: phase.operatingRoundId || 0 } },
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
    console.log('Resolving end turn', phase);
    // Get sectors and game
    const [sectors, game] = await Promise.all([
      this.sectorService.sectorsWithCompanies({
        where: { gameId: phase.gameId },
      }),
      this.gamesService.game({ id: phase.gameId }),
    ]);

    sectors.sort((a, b) => {
      return (
        sectorPriority.indexOf(a.sectorName) -
        sectorPriority.indexOf(b.sectorName)
      );
    });
    console.log('Sectors:', sectors);
    console.log('Game:', game);

    if (!game) {
      throw new Error('Game not found');
    }

    let marketingOrdersGroupedBySectorId: {
      sectorId: string;
      count: number;
    }[] = [];

    try {
      // Get all action orders of type marketing from the round and group by sector
      marketingOrdersGroupedBySectorId =
        await this.companyActionService.marketingOrdersGroupedBySectorId(
          game.currentOperatingRoundId || 0,
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
        console.log('update:', update, game.consumerPoolNumber, consumersToAdd);

        if (consumersToAdd > 0) {
          update.data.consumers += consumersToAdd;
          game.consumerPoolNumber -= consumersToAdd;
          remainingEconomyScore -= consumersToAdd;
          consumersMovedCounter += consumersToAdd;
        }
      }

      sectorIndex = (sectorIndex + 1) % sectors.length;
      console.log('remainingEconomyScore:', remainingEconomyScore);
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
  ): Promise<Player[]> {
    const users = await this.prisma.roomUser.findMany({
      where: {
        roomId,
      },
      include: {
        user: true,
      },
    });

    return await this.playersService.createManyPlayers(
      users.map((user) => ({
        nickname: user.user.name,
        cashOnHand: startingCashOnHand,
        gameId,
        userId: user.userId,
        marketOrderActions: MAX_MARKET_ORDER_ACTIONS,
        limitOrderActions: MAX_LIMIT_ORDER_ACTIONS,
        shortOrderActions: MAX_SHORT_ORDER_ACTIONS,
        marginAccount: 0,
      })),
    );
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
    } = input;

    const gameData: Prisma.GameCreateInput = {
      name: roomName,
      currentTurn: '',
      currentOrSubRound: 0,
      currentRound: 'INFLUENCE',
      bankPoolNumber,
      consumerPoolNumber,
      distributionStrategy,
      gameStatus: GameStatus.ACTIVE,
      gameStep: 0,
      currentPhaseId: 'initial',
      gameMaxTurns,
      economyScore: STABLE_ECONOMY_SCORE,
      Room: { connect: { id: roomId } },
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

      // Add players to the game
      const players = await this.addPlayersToGame(
        game.id,
        roomId,
        startingCashOnHand,
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
        demand: sector.demand,
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

      const companyData = selectedSectors.flatMap((sector) => {
        const companiesInSector = jsonData.companies.filter(
          (company) => company.sectorId === sector.id,
        );
        const selectedCompanies = this.getRandomElements(companiesInSector, 2);

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
      try {
        // Create sectors and companies
        const sectors = await this.sectorService.createManySectors(sectorData);
        //map sector ids to names and update companyData
        const newCompanyData = companyData.map((company) => {
          const sector = sectors.find((s) => s.name === company.sectorId);
          if (!sector) {
            throw new Error('Sector not found');
          }
          const ipoPrice = determineFloatPrice(sector);
          const stockTier = determineStockTier(ipoPrice);
          return {
            ...company,
            stockTier: stockTier,
            ipoAndFloatPrice: ipoPrice,
            currentStockPrice: ipoPrice,
            cashOnHand: ipoPrice * DEFAULT_SHARE_DISTRIBUTION,
            gameId: game.id,
            sectorId: sector.id,
          };
        });
        companies =
          await this.companyService.createManyCompanies(newCompanyData);
        //iterate through companies and create ipo shares
        const shares: {
          companyId: string;
          price: number;
          location: ShareLocation;
          gameId: string;
        }[] = [];
        companies.forEach((company) => {
          for (let i = 0; i < DEFAULT_SHARE_DISTRIBUTION; i++) {
            shares.push({
              price: company.ipoAndFloatPrice,
              location: ShareLocation.IPO,
              companyId: company.id,
              gameId: game.id,
            });
          }
        });
        await this.shareService.createManyShares(shares);
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
      // Start the timer for advancing to the next phase
      //TODO: Once the game is fully implemented, we can start the timer service again.  Something is wrong with it right now.
      await this.startPhaseTimer({
        phase: newPhase,
        gameId: game.id,
        influenceRoundId: influenceRound.id,
      });
      return game;
    } catch (error) {
      console.error('Error starting game:', error);
      throw new Error('Failed to start the game');
    }
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
    console.log('Created research cards:', createdResearchCards);

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

  /**
   * Arg data here stipulates data for the next phase with phaseName and companyId
   *
   * @param param0
   * @returns
   */
  public async determineIfNewRoundAndStartPhase({
    gameId,
    phaseName,
    roundType,
    stockRoundId,
    operatingRoundId,
    influenceRoundId,
    companyId,
  }: {
    gameId: string;
    phaseName: PhaseName;
    roundType: RoundType;
    stockRoundId?: number;
    operatingRoundId?: number;
    influenceRoundId?: number;
    companyId?: string;
  }) {
    console.log(
      'determineIfNewRoundAndStartPhase',
      phaseName,
      stockRoundId,
      operatingRoundId,
      influenceRoundId,
      roundType,
      companyId,
    );
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

    let newStockRound: StockRound | null = null;
    let newOperatingRound: OperatingRound | null = null;
    // If the current phase roundtype is different to the new one, initiate the new round
    if (game.currentRound !== roundType) {
      //start new round
      if (roundType === RoundType.STOCK) {
        newStockRound = await this.startStockRound(gameId);
      } else if (roundType === RoundType.OPERATING) {
        newOperatingRound = await this.startOperatingRound(gameId);
      } else if (roundType === RoundType.GAME_UPKEEP) {
        await this.gamesService.updateGameState({
          where: { id: gameId },
          data: {
            currentRound: RoundType.GAME_UPKEEP,
          },
        });
      }
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
    return this.startPhase({
      gameId,
      phaseName,
      roundType,
      stockRoundId: _stockRoundId,
      operatingRoundId: _operatingRoundId,
      influenceRoundId: _influenceRoundId,
      companyId,
    });
  }

  public async startStockRound(gameId: string): Promise<StockRound | null> {
    //get game
    const game = await this.gamesService.getGameState(gameId);
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
    return stockRound;
  }

  public async startOperatingRound(
    gameId: string,
  ): Promise<OperatingRound | null> {
    //get game
    const game = await this.gamesService.getGameState(gameId);
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
    operatingRoundId,
    influenceRoundId,
    companyId,
  }: {
    gameId: string;
    phaseName: PhaseName;
    roundType: RoundType;
    stockRoundId?: number;
    operatingRoundId?: number;
    influenceRoundId?: number;
    companyId?: string;
  }) {
    console.log('start phase phase name', phaseName);
    console.log('start phase stock round id', stockRoundId);
    console.log('start phase operating round id', operatingRoundId);
    console.log('start phase influence round id', influenceRoundId);
    console.log('start phase company id', companyId);
    const gameChannelId = getGameChannelId(gameId);
    //get game
    let game = await this.gamesService.getGameState(gameId);

    const phase = await this.phaseService.createPhase({
      name: phaseName,
      phaseTime: phaseTimes[phaseName],
      Game: { connect: { id: gameId } },
      GameTurn: { connect: { id: game?.currentTurn || '' } },
      StockRound: stockRoundId ? { connect: { id: stockRoundId } } : undefined,
      OperatingRound: operatingRoundId
        ? { connect: { id: operatingRoundId } }
        : undefined,
      InfluenceRound: influenceRoundId
        ? { connect: { id: influenceRoundId } }
        : undefined,
      Company: companyId ? { connect: { id: companyId } } : undefined,
    });

    // Update game state
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
      await this.handlePhase(phase);
    } catch (error) {
      console.error('Error during phase:', error);
      // Optionally handle retries or fallback logic here
    }
    try {
      console.log('pusher service new phase', EVENT_NEW_PHASE);
      this.pusherService.trigger(
        getGameChannelId(gameId),
        EVENT_NEW_PHASE,
        phaseName,
      );
    } catch (error) {
      console.error('Error triggering new phase:', error);
    }

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
      stockRoundId: game.currentStockRoundId || 0,
      operatingRoundId: game.currentOperatingRoundId || 0,
      influenceRoundId: game.InfluenceRound?.[0].id || 0,
      companyId: currentPhase.companyId || '',
    });
  }

  /**
   * This function starts the timer for the current phase and advances to the next phase.
   *
   * @param phase - The current phase object.
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
    stockRoundId?: number;
    operatingRoundId?: number;
    influenceRoundId?: number;
  }) {
    console.log(
      'start phase timer',
      phase,
      gameId,
      stockRoundId,
      operatingRoundId,
      influenceRoundId,
    );
    await this.timerService.setTimer(phase.id, phase.phaseTime, async () => {
      try {
        //get current phase
        const currentPhase = await this.phaseService.phase({
          id: phase.id,
        });
        const nameAndRoundTypeAndCompanyForNextPhase =
          await this.determineAndHandleNextPhase({
            phase,
            gameId,
          });

        const nextPhase = await this.determineIfNewRoundAndStartPhase({
          gameId,
          phaseName: nameAndRoundTypeAndCompanyForNextPhase.phaseName,
          roundType: nameAndRoundTypeAndCompanyForNextPhase.roundType,
          stockRoundId: phase.stockRoundId || undefined,
          operatingRoundId: phase.operatingRoundId || undefined,
          influenceRoundId: phase.influenceRoundId || undefined,
          companyId:
            nameAndRoundTypeAndCompanyForNextPhase.companyId ||
            currentPhase?.companyId ||
            '',
        });
        //get game
        const game = await this.gamesService.game({ id: gameId });
        //if game ended, stop the timer
        if (game?.gameStatus === GameStatus.FINISHED) {
          return;
        }
        await this.startPhaseTimer({
          phase: nextPhase,
          gameId,
          stockRoundId: nextPhase.stockRoundId || undefined,
          operatingRoundId: nextPhase.operatingRoundId || undefined,
          influenceRoundId: nextPhase.influenceRoundId || undefined,
        });
      } catch (error) {
        console.error('Error during phase transition:', error);
        // Optionally handle retries or fallback logic here
      }
    });
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
  }: {
    phase: Phase;
    gameId: string;
  }): Promise<{
    phaseName: PhaseName;
    roundType: RoundType;
    companyId?: string;
  }> {
    const determinedNextPhase = determineNextGamePhase(phase.name, {
      stockActionSubRound: phase.stockRoundId
        ? (
            await this.stockRoundService.stockRound({
              id: phase.stockRoundId,
            })
          )?.stockActionSubRound
        : undefined,
    });
    console.log('determined next phase', determinedNextPhase);
    let nextPhaseName = await this.adjustPhaseBasedOnGameState(
      determinedNextPhase.phaseName,
      phase,
      gameId,
    );

    let companyId;
    if (nextPhaseName === PhaseName.OPERATING_ACTION_COMPANY_VOTE) {
      companyId = await this.handleOperatingActionCompanyVote(
        nextPhaseName,
        phase,
        gameId,
      );
      if (!companyId) {
        nextPhaseName = PhaseName.CAPITAL_GAINS;
      }
    } else {
      companyId = phase.companyId;
    }

    if (!companyId) {
      companyId = undefined;
    }

    return {
      phaseName: nextPhaseName,
      roundType: determinedNextPhase.roundType,
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
  private async adjustPhaseBasedOnGameState(
    nextPhaseName: PhaseName,
    currentPhase: Phase,
    gameId: string,
  ): Promise<PhaseName> {
    //game state
    const gameState = await this.gamesService.getGameState(gameId);
    if (!gameState) {
      throw new Error('Game not found');
    }
    let doesNextPhaseNeedToBePlayed = await this.doesNextPhaseNeedToBePlayed(
      nextPhaseName,
      currentPhase,
    );
    console.log(
      'doesNextPhaseNeedToBePlayed next phase name',
      nextPhaseName,
      doesNextPhaseNeedToBePlayed,
    );
    while (!doesNextPhaseNeedToBePlayed) {
      nextPhaseName = determineNextGamePhase(nextPhaseName, {
        stockActionSubRound: gameState.StockRound.find(
          (stockRound) => stockRound.id === currentPhase?.stockRoundId,
        )?.stockActionSubRound,
      }).phaseName;
      doesNextPhaseNeedToBePlayed = await this.doesNextPhaseNeedToBePlayed(
        nextPhaseName,
        currentPhase,
      );
      console.log(
        'doesNextPhaseNeedToBePlayed next phase name',
        nextPhaseName,
        doesNextPhaseNeedToBePlayed,
      );
    }
    if (!nextPhaseName) {
      nextPhaseName = nextPhaseName;
    }

    return nextPhaseName;
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
  ): Promise<string | undefined> {
    //get game
    const gameState = await this.gamesService.getGameState(gameId);
    if (!gameState) {
      throw new Error('Game not found');
    }
    //get any companies that are insolvent
    const insolventCompanies = gameState.Company.filter(
      (company) => company.status === CompanyStatus.INSOLVENT,
    );
    //if there are insolvent companies, resolve the first one
    //as companies that are insolvent ultimately resolve into one of two states, bankrupt or active, we should
    //be able to safely assume that this check will ultimately pass and continue onto active companies
    if (insolventCompanies.length > 0) {
      return insolventCompanies[0].id;
    }
    const allCompaniesVoted =
      await this.haveAllCompaniesActionsResolved(gameId);
    console.log('allCompaniesVoted', allCompaniesVoted);
    if (allCompaniesVoted) {
      nextPhase = PhaseName.CAPITAL_GAINS;
      return undefined;
    } else {
      if (
        currentPhase?.companyId &&
        (currentPhase?.name == PhaseName.OPERATING_COMPANY_VOTE_RESOLVE ||
          currentPhase?.name == PhaseName.OPERATING_ACTION_COMPANY_VOTE ||
          currentPhase?.name == PhaseName.OPERATING_ACTION_COMPANY_VOTE_RESULT)
      ) {
        return getNextCompanyOperatingRoundTurn(
          gameState.Company.filter(
            (company) => company.status == CompanyStatus.ACTIVE,
          ),
          currentPhase?.companyId,
        )?.id;
      } else {
        //this should be the first company in the operating round
        return getNextCompanyOperatingRoundTurn(
          gameState.Company.filter(
            (company) => company.status == CompanyStatus.ACTIVE,
          ),
        ).id;
      }
    }
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
          await this.playerAddMoney(
            order.gameId,
            phase.gameTurnId,
            phase.id,
            order.playerId,
            (order.value || 0) * (order.quantity || 0),
            EntityType.BANK,
            `Limit order sell for ${order.Company.stockSymbol}`,
          );
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
          // TODO: Is this a safe assumption?
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
                this.prisma,
              );
              const sortedByBidValue = this.sortByBidValue(
                phaseOrders,
                playerPriorities,
              );
              // Reject all orders except the first
              await Promise.all(
                sortedByBidValue.slice(1).map(async (order) => {
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
                where: { id: sortedByBidValue[0].id },
                data: {
                  orderStatus: OrderStatus.OPEN,
                },
              });
              // Update the contract
              await this.optionContractService.updateOptionContract({
                where: { id: sortedByBidValue[0].optionContractId || 0 },
                data: {
                  contractState: ContractState.PURCHASED,
                  currentPremium: sortedByBidValue[0].value || 0,
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
              throw new Error('Not enough shares to place short order');
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
            content: `Stock price for ${
              orders[0].Company.name
            } has increased to $${newStockPrice.price.toFixed(
              2,
            )} due to market buy orders`,
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
            content: `Stock price for ${
              orders[0].Company.name
            } has decreased to $${stockPrice.price.toFixed(
              2,
            )} by ${netDifference} steps due to market sell orders`,
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
  async processMarketOrdersByCompany(
    groupedMarketOrders: Record<string, PlayerOrderWithPlayerCompany[]>,
    game: Game,
    phase: Phase,
  ) {
    await Promise.all(
      Object.entries(groupedMarketOrders).map(async ([companyId, orders]) => {
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
          if (game.distributionStrategy === DistributionStrategy.BID_PRIORITY) {
            await this.distributeSharesBidStrategy(
              buyOrdersIPO,
              ShareLocation.IPO,
              companyId,
              this.shareService,
              game,
              this.prisma,
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
          if (game.distributionStrategy === DistributionStrategy.BID_PRIORITY) {
            await this.distributeSharesBidStrategy(
              buyOrdersOM,
              ShareLocation.OPEN_MARKET,
              companyId,
              this.shareService,
              game,
              this.prisma,
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
      }),
    );
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
      },
    });
    if (playerActualSharesOwned.length < order.quantity!) {
      //reject the order
      await this.prisma.playerOrder.update({
        where: { id: order.id },
        data: {
          orderStatus: OrderStatus.REJECTED,
        },
      });
      //game log
      await this.gameLogService.createGameLog({
        game: { connect: { id: order.gameId } },
        content: `Player ${order.Player.nickname} does not have enough shares to sell`,
      });
      //throw
      throw new Error('Not enough shares to sell');
    }
    const sharesToSell = Math.min(playerActualSharesOwned.length, sellAmount);
    try {
      await this.playerAddMoney(
        order.gameId,
        order.gameTurnCreated,
        order.phaseId,
        order.playerId,
        sharesToSell * sharePrice,
        EntityType.BANK,
        `Player ${order.Player.nickname} has sold ${sharesToSell} shares of ${
          order.Company.name
        } at $${sharePrice.toFixed(2)}`,
      );
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

  getCurrentShareOrderFilledTotalPlayer(shareUpdates: any[]) {
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
  processBidOrdersBidStrategy(
    sortedOrders: PlayerOrderWithPlayerCompany[],
    remainingShares: number,
    allAvailableShares: Share[],
    currentShareIndex: number,
    shareUpdates: ShareUpdate[],
    playerCashUpdates: { playerId: string; decrement: number }[],
    orderStatusUpdates: any[],
    gameLogEntries: any[],
    playersWithShares: PlayerWithShares[], //we need this reference because we are now actively checking stock ownership and cash on hand
  ) {
    for (const order of sortedOrders) {
      if (remainingShares <= 0) {
        orderStatusUpdates.push({
          where: { id: order.id },
          data: { orderStatus: OrderStatus.REJECTED },
        });
      } else {
        //TODO: I don't think we need this since we're updating shares per phase now
        // const shareUpdatesForPlayerAndCompany = shareUpdates.filter(
        //   (update) =>
        //     update.data.playerId === order.playerId &&
        //     update.companyId === order.companyId,
        // );
        //const player share total
        console.log('order playerShareTotal', order);
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
        // console.log(
        //   'share order filled total',
        //   this.getCurrentShareOrderFilledTotalPlayer(
        //     shareUpdatesForPlayerAndCompany,
        //   ),
        // );
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
        } else if (
          player.cashOnHand <
          (order.value || 0) * (order.quantity || 0)
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
          if (sharesToGive > remainingShares) {
            // Reject the order if it cannot be fully fulfilled
            orderStatusUpdates.push({
              where: { id: order.id },
              data: { orderStatus: OrderStatus.REJECTED },
            });
            gameLogEntries.push({
              game: { connect: { id: order.gameId } },
              content: `Player ${order.Player.nickname} was not able to purchase shares of ${order.Company.name} from ${order.location} due to their not being enough shares available.`,
            });
          } else {
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
              decrement: sharesToGive * order.value!,
            });

            orderStatusUpdates.push({
              where: { id: order.id },
              data: { orderStatus: OrderStatus.FILLED },
            });

            gameLogEntries.push({
              game: { connect: { id: order.gameId } },
              content: `Player ${order.Player.nickname} has bought ${sharesToGive} shares of ${order.Company.name} at $${order.value}`,
            });

            remainingShares -= sharesToGive;
          }
        }
      }
    }
    return { currentShareIndex, remainingShares };
  }

  async fetchPlayerPriorities(playerIds: string[], prisma: PrismaService) {
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

  async distributeSharesBidStrategy(
    phaseOrders: PlayerOrderWithPlayerCompany[],
    location: ShareLocation,
    companyId: string,
    shareService: ShareService,
    game: Game,
    prisma: any,
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
      prisma,
    );
    const sortedByBidValue = this.sortByBidValue(phaseOrders, playerPriorities);
    const playersWithShares = await this.playersService.playersWithShares({
      gameId: game.id,
      id: { in: playerIds },
    });
    const {
      currentShareIndex: _currentShareIndex,
      remainingShares: _remainingShares,
    } = await this.processBidOrdersBidStrategy(
      sortedByBidValue,
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
    for (const order of validBuyOrders) {
      if (remainingShares <= 0) break;

      const sharesToAllocate = Math.min(order.quantity || 0, remainingShares);
      for (let i = 0; i < sharesToAllocate; i++) {
        const share = allAvailableShares[currentShareIndex];
        shareUpdates.push({
          ...share,
          playerId: order.playerId,
          location: ShareLocation.PLAYER,
        });

        playerCashUpdates.push({
          playerId: order.playerId,
          decrement: share.price,
        });

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
    console.log('shares per buyer', sharesPerBuyer);
    console.log('number of buyers', numBuyers);
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
        } at $${order[0].Company.currentStockPrice.toFixed(2)}`,
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
        } at $${order.Company.currentStockPrice.toFixed(2)}`,
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
        } at $${order.Company.currentStockPrice.toFixed(2)}`,
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

  async playerAddMoney(
    gameId: string,
    gameTurnId: string,
    phaseId: string,
    playerId: string,
    amount: number,
    fromEntity: EntityType,
    description?: string,
  ) {
    //get player fromm id
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
    });
    if (!player) {
      throw new Error('Player not found');
    }
    //create transaction
    this.transactionService.createTransactionEntityToEntity({
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
    });
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
    //the lowest player cash can go is 0
    const cashToRemove = Math.min(player.cashOnHand, amount);
    //create transaction
    this.transactionService.createTransactionEntityToEntity({
      gameId,
      gameTurnId,
      phaseId,
      amount: cashToRemove,
      fromEntityId: player.entityId || undefined,
      fromEntityType: EntityType.PLAYER,
      fromPlayerId: playerId,
      transactionType: TransactionType.CASH,
      toEntityType: toEntity,
      toEntityId,
      description,
    });
    //update bank pool for game
    await this.prisma.game.update({
      where: { id: gameId },
      data: {
        bankPoolNumber: {
          increment: cashToRemove,
        },
      },
    });
    const updatedPlayer = await this.prisma.player.update({
      where: { id: playerId },
      data: {
        cashOnHand: {
          decrement: cashToRemove,
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
    this.transactionService.createTransactionEntityToEntity({
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

  async haveAllCompaniesActionsResolved(gameId: string) {
    //get current operating round
    const game = await this.gamesService.getGameState(gameId);
    if (!game) {
      throw new Error('Game not found');
    }
    //get all active companies in the game
    const companies = await this.companyService.companies({
      where: {
        gameId,
      },
    });
    const currentOperatingRound =
      await this.operatingRoundService.operatingRoundWithCompanyActions({
        id: game.currentOperatingRoundId || 0,
      });
    if (!currentOperatingRound) {
      throw new Error('Operating round not found');
    }
    console.log('companies length', companies.length);
    console.log(
      'currentOperatingRound companyActions number',
      currentOperatingRound.companyActions.length,
    );
    if (companies.length > currentOperatingRound.companyActions.length) {
      return false;
    }
    //if any company action was EXPANSION or DOWNSIZE, adjust the company tier back to it's previous tier in a shallow copy
    //because tiers are changed upon resolution, we need to look at the tier before the action was taken when making this check.
    const companiesWithAdjustedTier = companies.map((company) => {
      const companyAction = currentOperatingRound.companyActions.find(
        (action) => action.companyId === company.id,
      );
      if (companyAction?.action === OperatingRoundAction.EXPANSION) {
        return {
          ...company,
          companyTier: getPreviousCompanyTier(company.companyTier),
        };
      }
      if (companyAction?.action === OperatingRoundAction.DOWNSIZE) {
        return {
          ...company,
          companyTier: getNextCompanyTier(company.companyTier),
        };
      }
      return company;
    });
    //get total company actions based on company tier
    const totalCompanyActions = companiesWithAdjustedTier.reduce(
      (acc, company) =>
        acc + CompanyTierData[company.companyTier].companyActions,
      0,
    );
    //check if all CompanyAction.resolved
    const resolvedCompanyActions = currentOperatingRound.companyActions.filter(
      (action) => action.resolved,
    );
    //check if all companies have at least one voted action
    const companiesWithVotedActions = companiesWithAdjustedTier.filter(
      (company) =>
        currentOperatingRound.companyActions.find(
          (action) => action.companyId === company.id,
        ),
    );
    return companiesWithVotedActions.length === companies.length;

    // console.log('resolvedCompanyActions', resolvedCompanyActions.length);
    // console.log('totalCompanyActions', totalCompanyActions);
    // return resolvedCompanyActions.length >= totalCompanyActions;
  }

  async doesNextPhaseNeedToBePlayed(phaseName: PhaseName, currentPhase: Phase) {
    switch (phaseName) {
      case PhaseName.STOCK_RESOLVE_LIMIT_ORDER:
        //count limit orders
        return this.limitOrdersRequiringFulfillment(currentPhase?.gameId || '');
      case PhaseName.STOCK_RESOLVE_MARKET_ORDER:
        return this.stockOrdersRequiredResolution(
          currentPhase?.stockRoundId || 0,
        );
      case PhaseName.STOCK_SHORT_ORDER_INTEREST:
        return this.stockOrdersOpen(currentPhase?.gameId || '');
      case PhaseName.STOCK_ACTION_SHORT_ORDER:
        return this.stockOrdersOpen(currentPhase?.gameId || '');
      case PhaseName.STOCK_RESOLVE_PENDING_SHORT_ORDER:
        return this.stockOrdersPending(currentPhase?.stockRoundId || 0);
      case PhaseName.STOCK_OPEN_LIMIT_ORDERS:
        return this.limitOrdersPending(currentPhase?.stockRoundId || 0);
      case PhaseName.STOCK_RESOLVE_OPTION_ORDER:
        return this.anyOptionOrdersPurchased(currentPhase?.gameId || '');
      case PhaseName.STOCK_RESOLVE_PENDING_OPTION_ORDER:
        return this.optionOrdersPending(currentPhase?.stockRoundId || 0);
      case PhaseName.STOCK_ACTION_OPTION_ORDER:
        return this.anyOptionOrdersToBeExercised(currentPhase?.gameId || '');
      default:
        return true;
    }
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
          order.Company.currentStockPrice >=
          (order.OptionContract?.strikePrice || 0),
      ).length > 0
    );
  }

  async optionOrdersPending(stockRoundId: number) {
    const playerOrders = await this.playerOrderService.playerOrders({
      where: {
        stockRoundId,
        orderType: OrderType.OPTION,
        orderStatus: OrderStatus.PENDING,
      },
    });
    return playerOrders.length > 0;
  }

  async limitOrdersPending(stockRoundId: number) {
    const playerOrders = await this.playerOrderService.playerOrders({
      where: {
        stockRoundId,
        orderType: OrderType.LIMIT,
        orderStatus: OrderStatus.PENDING,
      },
    });
    return playerOrders.length > 0;
  }

  async stockOrdersPending(stockRoundId: number) {
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

  async stockOrdersRequiredResolution(stockRoundId: number) {
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
    await this.playerAddMoney(
      optionContract.gameId,
      game.currentTurn || '',
      game.currentPhaseId || '',
      playerOrder.playerId,
      (optionContract.Company.currentStockPrice -
        (optionContract.strikePrice || 0)) *
        optionContract.shareCount,
      EntityType.BANK,
      `Option contract for ${optionContract.Company.name} exercised`,
    );
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
      } at $${optionContract.Company.currentStockPrice.toFixed(2)}`,
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
    this.transactionService.createTransactionEntityToEntity({
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
      shortOrder.Company.currentStockPrice * shortOrder.Share.length,
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
      shortOrder.Company.currentStockPrice,
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
      } for ${shortOrder.Company.name} at $${stockPrice.toFixed(2)}`,
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
    submissionStamp: Date | undefined;
  }) {
    //get game
    const game = await this.gamesService.game({ id: gameId });
    if (!game) {
      throw new Error('Game not found');
    }
    //get company associated with order
    const company = await this.companyService.company({ id: companyId });
    if (!company) {
      throw new Error('Company not found');
    }
    return this.playerOrderService.createPlayerOrder({
      orderType,
      location,
      quantity,
      value,
      isSell,
      orderStatus,
      Game: { connect: { id: gameId } },
      Company: { connect: { id: companyId } },
      Player: { connect: { id: playerId } },
      OptionContract: contractId ? { connect: { id: contractId } } : undefined,
      submissionStamp,
      StockRound: { connect: { id: game.currentStockRoundId || 0 } },
      Phase: { connect: { id: game.currentPhaseId || '' } },
      Sector: { connect: { id: company.sectorId } },
      GameTurn: { connect: { id: game.currentTurn || '' } },
    });
  }
}
