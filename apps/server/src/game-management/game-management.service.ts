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
  PlayerOrderWithCompany,
  PlayerOrderWithPlayerCompany,
  PlayerOrderWithPlayerCompanySectorShortOrder,
  PlayerWithShares,
  ShortOrderWithShares,
} from '@server/prisma/prisma.types';
import { StockRoundService } from '@server/stock-round/stock-round.service';
import { PhaseService } from '@server/phase/phase.service';
import {
  DEFAULT_SHARE_DISTRIBUTION,
  MAX_LIMIT_ORDER,
  MAX_MARKET_ORDER,
  MAX_SHORT_ORDER,
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
} from '@server/data/constants';
import { TimerService } from '@server/timer/timer.service';
import {
  calculateMarginAccountMinimum,
  calculateStepsAndRemainder,
  companyPriorityOrderOperations,
  createPrestigeTrackBasedOnSeed,
  createSeededResearchCards,
  determineFloatPrice,
  determineNextGamePhase,
  determineStockTier,
  getCurrentTierBySharePrice,
  getNextPrestigeInt,
  getNextTier,
} from '@server/data/helpers';
import { PusherService } from 'nestjs-pusher';
import { EVENT_NEW_PHASE, getGameChannelId } from '@server/pusher/pusher.types';
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

type GroupedByPhase = {
  [key: string]: {
    phase: Phase;
    orders: PlayerOrderWithPlayerCompany[];
  };
};

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
      case PhaseName.STOCK_SHORT_ORDER_INTEREST:
        await this.resolveShortOrdersInterest(phase);
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
        await this.adjustStockPrices(phase);
        await this.createOperatingRoundCompanyActions(phase);
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
      case PhaseName.END_TURN:
        await this.resolveEndTurn(phase);
        break;
      case PhaseName.DIVESTMENT:
        await this.resolveDivestment(phase);
        break;
      default:
        return;
    }
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

    // Iterate over players and collect any that have greater shares than game Share Limit and divest them
    const playersToDivest = players.filter(
      (player) => player.Share.length > DEFAULT_SHARE_LIMIT,
    );
    if (playersToDivest.length === 0) {
      return;
    }

    const sharePromises = playersToDivest.map(async (player) => {
      // Get the shares
      const shares = player.Share;

      // Get the shares to divest
      const sharesToDivest = shares.slice(10);
      const companyId = sharesToDivest[0].companyId; // Assuming all shares are from the same company

      const shareUpdates = sharesToDivest.map((share) => {
        return this.shareService.updateShare({
          where: { id: share.id },
          data: { location: ShareLocation.OPEN_MARKET },
        });
      });

      const sellPromises = sharesToDivest.map(async (share) => {
        const sharePrice = share.Company.currentStockPrice || 0;
        try {
          // Add money to the player
          await this.playerAddMoney(share.gameId, player.id, sharePrice);

          // Log the sale
          await this.gameLogService.createGameLog({
            game: { connect: { id: share.gameId } },
            content: `Player ${player.nickname} has sold 1 share of ${share.Company.name} at $${sharePrice.toFixed(2)}`,
          });
        } catch (error) {
          console.error('Error selling shares:', error);
        }
      });

      await Promise.all(sellPromises);
      await Promise.all(shareUpdates);

      // Calculate the net difference as the number of shares sold
      const netDifference = sharesToDivest.length;

      // Adjust stock price and trigger limit orders
      const stockPrice = await this.stockHistoryService.moveStockPriceDown(
        phase.gameId,
        companyId,
        phase.id,
        sharesToDivest[0].Company.currentStockPrice || 0,
        netDifference,
        StockAction.MARKET_SELL,
      );

      this.gameLogService.createGameLog({
        game: { connect: { id: phase.gameId } },
        content: `Stock price for ${
          sharesToDivest[0].Company.name
        } has decreased to $${stockPrice.price.toFixed(2)} due to market sell orders`,
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

    await Promise.all(sharePromises);
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
      const totalSharesValue = player.Share.reduce((acc, share) => {
        return acc + share.price;
      }, 0);
      return {
        playerId: player.id,
        netWorth: player.cashOnHand + totalSharesValue,
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

      const taxAmount = (netWorth * tier.taxPercentage) / 100;
      const player = players.find((p) => p.id === playerId);

      if (!player) {
        console.error(`Player not found: ${playerId}`);
        continue;
      }

      const newCashOnHand = Math.max(player.cashOnHand - taxAmount, 0);

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
          this.playersService.updatePlayer({
            where: { id: playerId },
            data: { cashOnHand: newCashOnHand },
          }),
        );

        gameLogPromises.push(
          this.gameLogService.createGameLog({
            game: { connect: { id: phase.gameId } },
            content: `Player ${player.nickname} has paid capital gains tax of ${taxAmount}.`,
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

    const companyActions = companies.map((company) => ({
      companyId: company.id,
      operatingRoundId: phase.operatingRoundId || 0,
    }));

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
      let moneyFromBank;

      switch (revenueDistribution) {
        case RevenueDistribution.DIVIDEND_FULL:
          dividend = revenue / company.Share.length;
          break;
        case RevenueDistribution.DIVIDEND_FIFTY_FIFTY:
          dividend = Math.floor(revenue / 2) / company.Share.length;
          break;
        case RevenueDistribution.RETAINED:
          break;
        default:
          continue;
      }

      moneyFromBank = revenue;

      if (dividend > 0) {
        //filter shares by location IPO
        const companyShares = company.Share.filter(
          (share) => share.location === ShareLocation.IPO,
        );
        const companyDividendTotal = dividend * companyShares.length;
        const updatedCompany = await this.companyService.updateCompany({
          where: { id: company.id },
          data: { cashOnHand: company.cashOnHand + companyDividendTotal },
        });
        //if company has positive cash on hand, make sure it's active
        if (updatedCompany.cashOnHand > 0) {
          await this.companyService.updateCompany({
            where: { id: company.id },
            data: { status: CompanyStatus.ACTIVE },
          });
        }
        this.gameLogService.createGameLog({
          game: { connect: { id: phase.gameId } },
          content: `Company ${company.name} has received dividends of ${companyDividendTotal}.`,
        });
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
            const dividendTotal = dividend * shares.length;
            await this.playersService.updatePlayer({
              where: { id: player.id },
              data: { cashOnHand: player.cashOnHand + dividendTotal },
            });
            this.gameLogService.createGameLog({
              game: { connect: { id: phase.gameId } },
              content: `Player ${player.nickname} has received dividends of ${dividendTotal}.`,
            });
          },
        );
        await Promise.all(sharePromises);
      } else {
        const companyUpdated = await this.companyService.updateCompany({
          where: { id: company.id },
          data: { cashOnHand: company.cashOnHand + moneyFromBank },
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
          content: `Company ${company.name} has retained ${moneyFromBank}.`,
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
    //get the company action
    const companyAction = await this.prisma.companyAction.findFirst({
      where: {
        operatingRoundId: phase.operatingRoundId || 0,
        companyId: phase.companyId || '',
      },
      include: {
        Company: true,
      },
    });
    if (!companyAction) {
      throw new Error('Company action not found');
    }
    //pay for company action
    try {
      await this.payForCompanyAction(companyAction);
    } catch (error) {
      console.error('Error paying for company action', error);
      throw new Error('Company cannot pay for the action.');
    }

    switch (companyAction.action) {
      case OperatingRoundAction.SHARE_ISSUE:
        await this.resolveIssueShares(companyAction);
        break;
      case OperatingRoundAction.MARKETING:
        await this.resolveMarketingAction(companyAction);
        break;
      case OperatingRoundAction.SHARE_BUYBACK:
        await this.resolveShareBuyback(companyAction);
        break;
      case OperatingRoundAction.SHARE_ISSUE:
        await this.resolveIssueShare(companyAction);
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
      default:
        return;
    }
    //resolve company action
    await this.companyActionService.updateCompanyAction({
      where: { id: companyAction.id },
      data: { resolved: true },
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
    //if the company does not have 3 prestige, move the prestige track forward
    if (company.prestigeTokens < 3) {
      await this.gamesService.updateGameState({
        where: { id: company.gameId },
        data: {
          nextPrestigeReward: getNextPrestigeInt(game.nextPrestigeReward || 0),
        },
      });
    } else {
      //if the company has 3 prestige, spend it
      await this.companyService.updateCompany({
        where: { id: company.id },
        data: {
          prestigeTokens: Math.max(company.prestigeTokens - 3, 0),
        },
      });
      const prestigeTrack = createPrestigeTrackBasedOnSeed(game.id);
      //create the prestige reward
      const prestigeReward =
        await this.prestigeRewardService.createPrestigeReward({
          Company: { connect: { id: company.id } },
          Game: { connect: { id: company.gameId } },
          GameTurn: { connect: { id: game.currentTurn } },
          reward: prestigeTrack[game.nextPrestigeReward || 0].type,
        });
      //resolve Reward
      this.resolvePrestigeReward(prestigeReward);
    }
  }

  async resolvePrestigeReward(prestigeReward: PrestigeRewards) {}

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
      throw new Error('Share not found');
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
        data: { demandScore: companyAction.Company.demandScore + 3 },
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
    //create new share for company
    return await this.shareService.createShare({
      Company: { connect: { id: companyAction.companyId } },
      location: ShareLocation.OPEN_MARKET,
      price: company.currentStockPrice,
      Game: { connect: { id: company.gameId } },
    });
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
      const revenueDistribution = result.revenueDistribution;

      if (!revenueDistribution) {
        console.error('Revenue distribution not found');
        continue;
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
          steps = Math.floor(revenue / company.currentStockPrice);
          newStockPrice = getStockPriceStepsUp(
            company.currentStockPrice,
            steps,
          );
          break;
        case RevenueDistribution.DIVIDEND_FIFTY_FIFTY:
          steps = Math.floor(
            Math.floor(revenue / 2) / company.currentStockPrice,
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
      console.error('No grouped votes not found');
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
      votes.forEach((vote) => {
        if (!voteCount[vote.revenueDistribution]) {
          voteCount[vote.revenueDistribution] = 0;
        }
        voteCount[vote.revenueDistribution] += vote.weight;
      });

      // Get the option with the most votes
      const maxVotes = Math.max(...Object.values(voteCount));
      const maxVote = Object.keys(voteCount).find(
        (key) => voteCount[key] === maxVotes,
      );
      //TODO: How do we resolve ties?

      if (maxVote) {
        productionResultsUpdates.push({
          where: {
            id: votes[0].productionResultId,
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

  /**
   * Determine supply and demand difference, award bonuses and penalties.
   * Determine company operations revenue.
   * Calculate the "throughput" by finding the diff between the supply and demand.
   * If a company has a throughput of 0, it is considered to have met optimal efficieny
   * and gets a prestige token and also benefits the entire sector.
   * @param phase
   * @returns
   */
  async resolveOperatingProduction(phase: Phase) {
    let companies = await this.companyService.companiesWithSector({
      where: { gameId: phase.gameId, status: CompanyStatus.ACTIVE },
    });
    if (!companies) {
      throw new Error('Companies not found');
    }

    //reduce company cash on hand by operating fees
    const companyCashOnHandUpdates: {
      id: string;
      cashOnHand: number;
      status: CompanyStatus;
    }[] = companies.map((company) => {
      //if company cannot afford to pay operating costs, it goes insolvent
      if (
        company.cashOnHand < CompanyTierData[company.companyTier].operatingCosts
      ) {
        this.gameLogService.createGameLog({
          game: { connect: { id: phase.gameId } },
          content: `Company ${company.name} has gone bankrupt.`,
        });
        return {
          id: company.id,
          cashOnHand: 0,
          status: CompanyStatus.BANKRUPT,
        };
      }
      this.gameLogService.createGameLog({
        game: { connect: { id: phase.gameId } },
        content: `Company ${company.name} has paid operating costs of ${CompanyTierData[company.companyTier].operatingCosts}.`,
      });
      return {
        id: company.id,
        cashOnHand:
          company.cashOnHand -
          CompanyTierData[company.companyTier].operatingCosts,
        status: CompanyStatus.ACTIVE,
      };
    });
    //update companies
    await Promise.all(
      companyCashOnHandUpdates.map((update) =>
        this.companyService.updateCompany({
          where: { id: update.id },
          data: { cashOnHand: update.cashOnHand, status: update.status },
        }),
      ),
    );

    //filter out bankrupt companies
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
    const companyUpdates: {
      id: string;
      prestigeTokens?: number;
      demandScore?: number;
    }[] = [];
    const productionResults: Prisma.ProductionResultCreateManyInput[] = [];
    const stockPenalties: {
      gameId: string;
      companyId: string;
      phaseId: string;
      currentStockPrice: number;
      steps: number;
    }[] = [];
    const sectorConsumersUpdates: { id: string; consumers: number }[] = [];

    // Iterate through each sector and the companies inside them
    for (const [sectorId, sectorCompanies] of Object.entries(
      groupedCompanies,
    )) {
      // Get sector
      const sector = await this.sectorService.sector({ id: sectorId });
      if (!sector) {
        console.error('Sector not found');
        continue;
      }

      let consumers = sector.consumers;
      const sectorCompaniesSorted =
        companyPriorityOrderOperations(sectorCompanies);
      // Iterate over companies in sector
      for (const company of sectorCompaniesSorted) {
        // Calculate throughput
        const throughput =
          company.demandScore + company.Sector.demand - company.supplyMax;
        console.log('Throughput:', throughput, company.name, company);
        // Consult throughput score to see reward or penalty.
        const throughputOutcome = throughputRewardOrPenalty(throughput);
        //subtract one from demand score of company
        const companyUpdate = {
          id: company.id,
          demandScore: Math.max(company.demandScore - 1, 0),
          prestigeTokens: company.prestigeTokens || 0,
        };
        // Award or penalize the company
        if (throughputOutcome.type === ThroughputRewardType.SECTOR_REWARD) {
          // Award prestige token
          companyUpdate.prestigeTokens = (company.prestigeTokens || 0) + 1;
          sectorRewards[sectorId] = (sectorRewards[sectorId] || 0) + 1; // TODO: Implement sector-wide rewards if needed.
          this.gameLogService.createGameLog({
            game: { connect: { id: phase.gameId } },
            content: `Company ${company.name} has met optimal efficiency and has been awarded a prestige token.`,
          });
        } else if (
          throughputOutcome.type === ThroughputRewardType.STOCK_PENALTY
        ) {
          // Penalize the company
          stockPenalties.push({
            gameId: phase.gameId,
            companyId: company.id,
            phaseId: String(phase.id),
            currentStockPrice: company.currentStockPrice || 0,
            steps: throughputOutcome.share_price_steps_down || 0,
          });
          this.gameLogService.createGameLog({
            game: { connect: { id: phase.gameId } },
            content: `Company ${company.name} has not met optimal efficiency and has been penalized ${throughputOutcome.share_price_steps_down} share price steps down.`,
          });
        }

        // Calculate the revenue for the company units sold
        let unitsSold = Math.min(
          company.supplyMax,
          company.demandScore + company.Sector.demand,
        );
        //is there enough consumers to buy all the supply?
        // consumers are 1:1 with units sold, TODO: We may want to allow
        // this ratio to be different at some point, perhaps even by sector
        if (unitsSold > consumers) {
          unitsSold = consumers;
        }
        const revenue = company.unitPrice * unitsSold;
        //update consumers
        consumers -= unitsSold;
        //update sector consumers
        sectorConsumersUpdates.push({
          id: sectorId,
          consumers,
        });
        // Create a production result
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

    // Perform bulk updates
    await Promise.all(
      [
        ...companyUpdates.map((update) =>
          this.prisma.company.update({
            where: { id: update.id },
            data: {
              prestigeTokens: update.prestigeTokens,
              demandScore: update.demandScore,
            },
          }),
        ),
        this.productionResultService.createManyProductionResults(
          productionResults,
        ),
        ...stockPenalties.map(async (penalty) => {
          const newHistory = await this.stockHistoryService.moveStockPriceDown(
            penalty.gameId,
            penalty.companyId,
            penalty.phaseId,
            penalty.currentStockPrice,
            penalty.steps,
            StockAction.PRODUCTION,
          );
          return this.playerOrderService.triggerLimitOrdersFilled(
            penalty.currentStockPrice,
            newHistory.price,
            penalty.companyId,
          );
        }),
        ...sectorConsumersUpdates.map((update) =>
          this.prisma.sector.update({
            where: { id: update.id },
            data: { consumers: update.consumers },
          }),
        ),
      ].filter(Boolean),
    );
  }

  async createManyProductionResults(
    results: Prisma.ProductionResultCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.productionResult.createMany({
      data: results,
      skipDuplicates: true,
    });
  }

  /**
   * Resolve the company votes, if there is a tie, we take priority in the vote priority order.
   *
   * @param phase
   */
  async resolveCompanyVotes(phase: Phase) {
    //get company from phase
    const company = await this.companyService.company({
      id: phase.companyId || '',
    });
    if (!company) {
      throw new Error('Company not found');
    }
    if (company.status !== CompanyStatus.ACTIVE) {
      throw new Error('Company is not active');
    }
    //Collect votes
    const votes = await this.prisma.operatingRoundVote.findMany({
      where: {
        companyId: company.id,
        operatingRoundId: phase.operatingRoundId || 0,
      },
      include: {
        Player: {
          include: {
            Share: true,
          },
        },
      },
    });
    //get most voted action weighted by shares
    type ActionVotesAccumulator = {
      [key in OperatingRoundAction]?: number;
    };

    // Assuming votes is properly typed
    const actionVotes = votes.reduce<ActionVotesAccumulator>((acc, vote) => {
      if (vote.actionVoted in acc) {
        acc[vote.actionVoted] = (acc[vote.actionVoted] || 0) + vote.weight;
      } else {
        acc[vote.actionVoted] = vote.weight;
      }
      return acc;
    }, {} as ActionVotesAccumulator);

    console.log('Action votes:', actionVotes);

    // Find the maximum number of votes
    const maxVotes = Math.max(...Object.values(actionVotes));
    console.log('Max votes:', maxVotes);
    // Get all actions with the maximum votes
    const actionsWithMaxVotes = Object.keys(actionVotes).filter(
      (key) => actionVotes[key as OperatingRoundAction] === maxVotes,
    ) as OperatingRoundAction[];
    console.log('Actions with max votes:', actionsWithMaxVotes);
    const resolvedAction = companyVoteActionPriority(actionsWithMaxVotes);
    console.log('Resolved action:', resolvedAction);
    try {
      const companyAction = await this.companyActionService.companyActionFirst({
        where: {
          companyId: company.id,
          operatingRoundId: phase.operatingRoundId || 0,
        },
      });
      if (!companyAction) {
        throw new Error('Company action not found');
      }
      //create new operating round action
      await this.companyActionService.updateCompanyAction({
        where: {
          id: companyAction.id,
        },
        data: {
          action: resolvedAction,
        },
      });
    } catch (error) {
      console.error('Error creating company action', error);
      throw new Error('Company action cannot be created');
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
      this.sectorService.sectors({ where: { gameId: phase.gameId } }),
      this.gamesService.game({ id: phase.gameId }),
    ]);

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
    const economyScore = STABLE_ECONOMY_SCORE;
    let consumersMovedCounter = 0;

    // Distribute consumer pool to sectors based on marketing bonus
    sectors.forEach((sector) => {
      let marketingBonus = 0;
      if (marketingOrdersGroupedBySectorId.length > 0) {
        marketingBonus =
          (marketingOrdersGroupedBySectorId.find(
            (order) => order.sectorId === sector.id,
          )?.count || 0) * 5;
      }
      consumersMovedCounter += marketingBonus;

      const consumersToAdd = Math.min(game.consumerPoolNumber, marketingBonus);
      if (consumersToAdd > 0) {
        sectorUpdates.push({
          where: { id: sector.id },
          data: { consumers: sector.consumers + consumersToAdd },
        });
        game.consumerPoolNumber -= consumersToAdd;
      }
    });

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
        const allocation = Math.min(sector.demand, remainingEconomyScore);
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
        marketOrderActions: MAX_MARKET_ORDER,
        limitOrderActions: MAX_LIMIT_ORDER,
        shortOrderActions: MAX_SHORT_ORDER,
        marginAccount: 0,
      })),
    );
  }

  async startGame(input: StartGameInput): Promise<Game> {
    const { roomId, startingCashOnHand, consumerPoolNumber, bankPoolNumber } =
      input;

    const gameData: Prisma.GameCreateInput = {
      name: `Game_Fantastic`,
      currentTurn: '',
      currentOrSubRound: 0,
      currentRound: 'STOCK',
      bankPoolNumber,
      consumerPoolNumber,
      gameStatus: 'started',
      gameStep: 0,
      currentPhaseId: 'initial',
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
      await this.addPlayersToGame(game.id, roomId, startingCashOnHand);

      // Randomly select 3 sectors
      const selectedSectors = this.getRandomElements(
        jsonData.sectors,
        3,
      ) as Sector[];

      // Prepare sectors and companies for batch creation
      const sectorData = selectedSectors.map((sector) => ({
        id: sector.id,
        name: sector.name,
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
          companyTier: company.companyTier,
          demandScore: 0,
          supplyCurrent: 0,
          supplyMax:
            CompanyTierData[company.companyTier as CompanyTier].supplyMax,
          sectorId: sector.name, //map to name at first then match to supabase for id
          gameId: game.id,
          insolvent: company.insolvent,
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
      let stockRound: StockRound | null;
      try {
        stockRound = await this.startStockRound(game.id);
      } catch (error) {
        console.error('Error starting game:', error);
        throw new Error('Failed to start the stock round.');
      }
      if (!stockRound) {
        throw new Error('Stock round not found');
      } else {
        // Start the stock round phase
        const newPhase = await this.startPhase({
          gameId: game.id,
          stockRoundId: stockRound.id,
          phaseName: PhaseName.STOCK_MEET,
          roundType: RoundType.STOCK,
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
        // Start the timer for advancing to the next phase
        await this.startPhaseTimer(newPhase, game.id, stockRound.id);
      }
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
      Game: { connect: {id: gameId } },
    });

    researchCards = researchCards.map((card) => ({
      ...card,
      gameId,
      deckId: researchDeck.id,
    }));
    
    await this.cardsService.createManyCards(researchCards);
    
    return this.researchDeckService.updateResearchDeck({
      where: { id: researchDeck.id },
      data: {
        cards: {
          connect: researchCards.map((card) => ({ id: card.id })),
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

  public async determineIfNewRoundAndStartPhase({
    gameId,
    phaseName,
    roundType,
    stockRoundId,
    operatingRoundId,
    companyId,
  }: {
    gameId: string;
    phaseName: PhaseName;
    roundType: RoundType;
    stockRoundId?: number;
    operatingRoundId?: number;
    companyId?: string;
  }) {
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
            currentOperatingRoundId: null,
            currentStockRoundId: null,
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
    return this.startPhase({
      gameId,
      phaseName,
      roundType,
      stockRoundId: _stockRoundId,
      operatingRoundId: _operatingRoundId,
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
    companyId,
  }: {
    gameId: string;
    phaseName: PhaseName;
    roundType: RoundType;
    stockRoundId?: number;
    operatingRoundId?: number;
    companyId?: string;
  }) {
    console.log('start phase phase name', phaseName);
    console.log('start phase stock round id', stockRoundId);
    console.log('start phase operating round id', operatingRoundId);
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
      Company: companyId ? { connect: { id: companyId } } : undefined,
    });

    // Update game state
    game = await this.gamesService.updateGameState({
      where: { id: gameId },
      data: {
        currentPhaseId: phase.id,
        currentStockRoundId: stockRoundId,
        currentOperatingRoundId: operatingRoundId,
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
        : RoundType.OPERATING,
      stockRoundId: game.currentStockRoundId || 0,
      operatingRoundId: game.currentOperatingRoundId || 0,
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
  private async startPhaseTimer(
    phase: Phase,
    gameId: string,
    stockRoundId?: number,
    operatingRoundId?: number,
  ) {
    await this.timerService.setTimer(phase.id, phase.phaseTime, async () => {
      try {
        const nextPhase = determineNextGamePhase(phase.name);

        await this.startPhase({
          gameId,
          phaseName: nextPhase.phaseName,
          roundType: nextPhase.roundType,
          stockRoundId,
          operatingRoundId,
        });
      } catch (error) {
        console.error('Error during phase transition:', error);
        // Optionally handle retries or fallback logic here
      }
    });
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
      if (order.isSell) {
        await this.playerAddMoney(
          order.gameId,
          order.playerId,
          order.value || 0,
        );

        //remove one share from the player's portfolio
        const share = await this.prisma.share.findFirst({
          where: {
            playerId: order.playerId,
            companyId: order.companyId,
            location: ShareLocation.PLAYER,
          },
        });

        if (!share) {
          throw new Error('Share not found');
        }
        //update share location to open market
        await this.shareService.updateManySharesUnchecked({
          where: { id: share.id },
          data: { playerId: null, location: ShareLocation.OPEN_MARKET },
        });
      } else {
        //buy order
        this.playerRemoveMoney(order.gameId, order.playerId, order.value || 0);

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

  async resolveShortOrdersInterest(phase: Phase) {
    if (phase.stockRoundId) {
      const playerOrders: PlayerOrderWithPlayerCompanySectorShortOrder[] =
        await this.prisma.playerOrder.findMany({
          where: { stockRoundId: phase.stockRoundId },
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
      if (!playerOrders) {
        throw new Error('Stock round not found');
      }
      //filter all short orders
      const shortOrders = playerOrders.filter(
        (order) => order.orderType === OrderType.SHORT,
      );
      //collect interest from the players who have short orders by multiplying the interest rate by the "principal", which is the price of the share at the time it was issued.
      shortOrders.forEach(async (order) => {
        if (order.ShortOrder) {
          //after the first turn, short orders begin to accrue interest
          const shortOrder: ShortOrderWithShares = order.ShortOrder;
          //subtract this from the players cash on hand
          this.playerRemoveMoney(
            order.gameId,
            order.playerId,
            shortOrder.borrowRate *
              (shortOrder.shortSalePrice * shortOrder.Share.length),
          );
        }
      });
    }
  }

  async resolvePendingShortOrders(phase: Phase) {
    if (phase.stockRoundId) {
      const playerOrders: PlayerOrderWithPlayerCompanySectorShortOrder[] =
        await this.prisma.playerOrder.findMany({
          where: {
            stockRoundId: phase.stockRoundId,
            orderStatus: OrderStatus.PENDING,
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
      if (!playerOrders) {
        throw new Error('Stock round not found');
      }
      //filter all short orders
      const shortOrders = playerOrders.filter(
        (order) => order.orderType === OrderType.SHORT,
      );
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
            throw new Error(
              'Player does not have enough cash to fund margin account to place order',
            );
          } else {
            //check player margin account balance
            const player = order.Player;
            //get all player short orders and calculate margin account required total
            const playerShortOrders = await this.prisma.playerOrder.findMany({
              where: {
                playerId: player.id,
                orderType: OrderType.SHORT,
              },
              include: {
                ShortOrder: true,
              },
            });
            //add marginAccountMinimum together
            const marginAccountMinimumTotal = playerShortOrders.reduce(
              (acc, order) =>
                acc + (order.ShortOrder?.marginAccountMinimum || 0),
              0,
            );
            const newShortOrderMarginAccountMinimum =
              calculateMarginAccountMinimum(shortInitialTotalValue);
            //if the player does not have enough currently, take money from cashOnHand and fill the marginAccount
            if (
              marginAccountMinimumTotal + newShortOrderMarginAccountMinimum >
              player.cashOnHand
            ) {
              const difference =
                marginAccountMinimumTotal +
                newShortOrderMarginAccountMinimum -
                player.cashOnHand;
              await this.prisma.player.update({
                where: { id: player.id },
                data: {
                  cashOnHand: {
                    decrement: difference,
                  },
                  marginAccount: {
                    increment: difference,
                  },
                },
              });
            }
          }
          //create the short order
          await this.prisma.shortOrder.create({
            data: {
              shortSalePrice: order.Company.currentStockPrice || 0,
              marginAccountMinimum: calculateMarginAccountMinimum(
                shortInitialTotalValue,
              ),
              borrowRate: BORROW_RATE,
              PlayerOrder: { connect: { id: order.id } },
            },
          });
          //update the player order status to filled
          await this.prisma.playerOrder.update({
            where: { id: order.id },
            data: {
              orderStatus: OrderStatus.OPEN,
            },
          });
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
    if (phase.stockRoundId) {
      const playerOrders: PlayerOrderWithPlayerCompany[] =
        await this.playerOrderService.playerOrdersWithPlayerCompany({
          where: { stockRoundId: phase.stockRoundId },
        });
      if (!playerOrders) {
        throw new Error('Stock round not found');
      }

      // Filter and process market orders
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

      // Group market orders by company
      const groupedMarketOrdersNoIpoBuyOrders =
        marketOrdersNoIpoBuyOrders.reduce<{
          [key: string]: PlayerOrderWithPlayerCompany[];
        }>((acc, order) => {
          if (!acc[order.companyId]) {
            acc[order.companyId] = [];
          }
          acc[order.companyId].push(order);
          return acc;
        }, {});

      // Find the net difference of buys and sells for each company
      const netDifferences = Object.entries(
        groupedMarketOrdersNoIpoBuyOrders,
      ).map(([companyId, orders]) => {
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
      });

      try {
        // Process net differences and update stock prices
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

            // Update stock prices and log changes
            if (netDifference > 0) {
              await this.companyService.updateCompany({
                where: { id: companyId },
                data: {
                  tierSharesFulfilled: newTierSharesFulfilled,
                  stockTier: newTier,
                },
              });
              const newStockPrice =
                await this.stockHistoryService.moveStockPriceUp(
                  orders[0].gameId,
                  companyId,
                  phase.id,
                  orders[0].Company.currentStockPrice || 0,
                  steps,
                  StockAction.MARKET_BUY,
                );
              await this.gameLogService.createGameLog({
                game: { connect: { id: orders[0].gameId } },
                content: `Stock price for ${orders[0].Company.name} has increased to $${newStockPrice.price.toFixed(2)} due to market buy orders`,
              });
              await this.playerOrderService.triggerLimitOrdersFilled(
                orders[0].Company.currentStockPrice || 0,
                newStockPrice.price,
                companyId,
              );
            } else if (netDifference < 0) {
              const stockPrice =
                await this.stockHistoryService.moveStockPriceDown(
                  orders[0].gameId,
                  companyId,
                  phase.id,
                  orders[0].Company.currentStockPrice || 0,
                  netDifference,
                  StockAction.MARKET_SELL,
                );
              await this.gameLogService.createGameLog({
                game: { connect: { id: orders[0].gameId } },
                content: `Stock price for ${orders[0].Company.name} has decreased to $${stockPrice.price.toFixed(2)} due to market sell orders`,
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
      } catch (error) {
        console.error('Error resolving netDifferences iteration:', error);
      }

      // Group market orders by company again for share distribution
      const groupedMarketOrders = marketOrders.reduce<{
        [key: string]: PlayerOrderWithPlayerCompany[];
      }>((acc, order) => {
        if (!acc[order.companyId]) {
          acc[order.companyId] = [];
        }
        acc[order.companyId].push(order);
        return acc;
      }, {});

      try {
        // Distribute shares and resolve sell orders
        await Promise.all(
          Object.entries(groupedMarketOrders).map(
            async ([companyId, orders]) => {
              // Resolve sell orders
              await Promise.all(
                orders.map(async (order) => {
                  if (order.isSell) {
                    const sellAmount = order.quantity || 0;
                    const sharePrice = order.Company.currentStockPrice || 0;
                    const playerActualSharesOwned =
                      await this.shareService.shares({
                        where: {
                          playerId: order.playerId,
                          companyId,
                          location: ShareLocation.PLAYER,
                        },
                      });
                    const sharesToSell = Math.min(
                      playerActualSharesOwned.length,
                      sellAmount,
                    );
                    try {
                      await this.playerAddMoney(
                        order.gameId,
                        order.playerId,
                        sharesToSell * sharePrice,
                      );
                      await this.gameLogService.createGameLog({
                        game: { connect: { id: order.gameId } },
                        content: `Player ${order.Player.nickname} has sold ${sharesToSell} shares of ${order.Company.name} at $${sharePrice.toFixed(2)}`,
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
                }),
              );

              // Distribute shares for buy orders
              const buyOrdersIPO = orders.filter(
                (order) => !order.isSell && order.location == ShareLocation.IPO,
              );
              if (buyOrdersIPO.length > 0) {
                await this.distributeShares(
                  buyOrdersIPO,
                  ShareLocation.IPO,
                  companyId,
                  this.shareService,
                );
                await this.checkIfCompanyIsFloated(companyId);
              }
              const buyOrdersOM = orders.filter(
                (order) =>
                  !order.isSell && order.location == ShareLocation.OPEN_MARKET,
              );
              if (buyOrdersOM.length > 0) {
                await this.distributeShares(
                  buyOrdersOM,
                  ShareLocation.OPEN_MARKET,
                  companyId,
                  this.shareService,
                );
              }
            },
          ),
        );
      } catch (error) {
        console.error('Error distributing shares:', error);
      }

      // Reset market order actions for players
      const players = await this.playersService.players({
        where: { gameId: phase.gameId },
      });
      try {
        await Promise.all(
          players.map((player) =>
            this.playersService.updatePlayer({
              where: { id: player.id },
              data: { marketOrderActions: MAX_MARKET_ORDER },
            }),
          ),
        );
      } catch (error) {
        console.error('Error setting market order actions:', error);
      }
    }
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
    buyOrders: PlayerOrderWithPlayerCompany[],
    location: ShareLocation,
    companyId: string,
    shareService: ShareService,
  ) {
    let currentShareIndex = 0;

    // Collect all updates to be made in batch
    const shareUpdates = [];
    const playerCashUpdates: { playerId: string; decrement: number }[] = [];
    const orderStatusUpdates = [];
    const gameLogEntries = [];

    // Fetch the company details including shares
    const company = buyOrders[0].Company;
    const totalCompanyShares = company.Share.length;
    const maxSharesPerPlayer =
      totalCompanyShares * (MAX_SHARE_PERCENTAGE / 100);

    // Track current shares owned by each player
    const playerShares: Record<string, number> = {};

    // Calculate current shares owned by each player
    for (const share of company.Share) {
      if (share.location === ShareLocation.PLAYER && share.playerId) {
        if (!playerShares[share.playerId]) {
          playerShares[share.playerId] = 0;
        }
        playerShares[share.playerId] += 1;
      }
    }

    // Track running total of placed orders for each player
    const playerOrderQuantities: Record<string, number> = {}; // { [playerId]: number }

    const validBuyOrders = buyOrders.filter((order) => {
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

    // Calculate the total number of shares requested
    const totalBuyOrderShares = validBuyOrders.reduce(
      (acc, order) => acc + (order.quantity || 0),
      0,
    );

    // Calculate the number of remaining shares at the specified location
    let remainingShares = Math.min(
      company.Share.filter((share) => share.location == location).length,
      totalBuyOrderShares,
    );

    // Group buy orders by their associated phase
    const groupedByPhase = validBuyOrders.reduce<GroupedByPhase>(
      (acc, order) => {
        const phaseId = order.Phase.id;
        if (!acc[phaseId]) {
          acc[phaseId] = {
            phase: order.Phase,
            orders: [],
          };
        }
        acc[phaseId].orders.push(order);
        return acc;
      },
      {},
    );

    // Sort phases by their creation time, earliest first
    const sortedByPhaseCreatedAt = Object.values(groupedByPhase).sort(
      (a, b) => a.phase.createdAt.getTime() - b.phase.createdAt.getTime(),
    );

    // Fetch all shares that can be distributed upfront
    const allAvailableShares = await shareService.shares({
      where: { companyId, location },
      take: remainingShares,
    });

    // Distribute shares within each phase
    for (const groupedOrders of sortedByPhaseCreatedAt) {
      if (remainingShares <= 0) break;

      const totalSharesInPhase = groupedOrders.orders.reduce(
        (acc, order) => acc + (order.quantity || 0),
        0,
      );

      if (totalSharesInPhase > remainingShares) {
        // If total shares requested in the phase exceed remaining shares
        const numBuyers = groupedOrders.orders.length;
        const sharesPerBuyer = Math.floor(remainingShares / numBuyers);
        const extraShares = remainingShares % numBuyers;

        // Distribute shares proportionally
        for (const order of groupedOrders.orders) {
          const sharesToDistribute = Math.min(
            sharesPerBuyer,
            order.quantity || 0,
          );
          if (sharesToDistribute <= 0) continue;

          const shares = allAvailableShares.slice(
            currentShareIndex,
            currentShareIndex + sharesToDistribute,
          );
          currentShareIndex += sharesToDistribute;

          shareUpdates.push({
            where: { id: { in: shares.map((share) => share.id) } },
            data: {
              location: ShareLocation.PLAYER,
              playerId: order.playerId,
            },
          });

          playerCashUpdates.push({
            playerId: order.playerId,
            decrement: sharesToDistribute * order.Company.currentStockPrice!,
          });

          orderStatusUpdates.push({
            where: { id: order.id },
            data: { orderStatus: OrderStatus.FILLED },
          });

          gameLogEntries.push({
            game: { connect: { id: order.gameId } },
            content: `Player ${order.Player.nickname} has bought ${sharesToDistribute} shares of ${
              order.Company.name
            } at $${order.Company.currentStockPrice.toFixed(2)}`,
          });

          remainingShares -= sharesToDistribute;
        }

        // Allocate remaining shares using a lottery system
        const remainingGroupedOrders = groupedOrders.orders.filter(
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
            content: `Player ${order.Player.nickname} has won a lottery for a share of ${
              order.Company.name
            } at $${order.Company.currentStockPrice.toFixed(2)}`,
          });

          remainingShares -= 1;
          remainingGroupedOrders[randomIndex].quantity! -= 1;
          if (remainingGroupedOrders[randomIndex].quantity! <= 0) {
            remainingGroupedOrders.splice(randomIndex, 1);
          }
        }

        // Mark remaining orders as rejected
        remainingGroupedOrders.forEach((order) => {
          orderStatusUpdates.push({
            where: { id: order.id },
            data: { orderStatus: OrderStatus.REJECTED },
          });
        });
      } else {
        // Distribute shares if total shares requested in phase do not exceed remaining shares
        for (const order of groupedOrders.orders) {
          const sharesToGive = Math.min(order.quantity || 0, remainingShares);

          const shares = allAvailableShares.slice(
            currentShareIndex,
            currentShareIndex + sharesToGive,
          );
          currentShareIndex += sharesToGive;

          shareUpdates.push({
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
            content: `Player ${order.Player.nickname} has bought ${sharesToGive} shares of ${
              order.Company.name
            } at $${order.Company.currentStockPrice.toFixed(2)}`,
          });

          remainingShares -= sharesToGive;
        }
      }
    }

    console.log('playerCashUpdates', playerCashUpdates);

    try {
      // Execute updates in smaller batches to reduce lock contention
      const BATCH_SIZE = 5; // Define a suitable batch size

      for (let i = 0; i < shareUpdates.length; i += BATCH_SIZE) {
        const batch = shareUpdates.slice(i, i + BATCH_SIZE);
        await this.prisma.$transaction(
          batch.map((update) => this.prisma.share.updateMany(update)),
        );
      }

      for (let i = 0; i < playerCashUpdates.length; i += BATCH_SIZE) {
        const batch = playerCashUpdates.slice(i, i + BATCH_SIZE);
        await this.prisma.$transaction(
          batch.map((update) =>
            this.prisma.player.update({
              where: { id: update.playerId },
              data: {
                cashOnHand: {
                  decrement: update.decrement,
                },
              },
            }),
          ),
        );
      }

      for (let i = 0; i < orderStatusUpdates.length; i += BATCH_SIZE) {
        const batch = orderStatusUpdates.slice(i, i + BATCH_SIZE);
        await this.prisma.$transaction(
          batch.map((update) => this.prisma.playerOrder.update(update)),
        );
      }

      for (let i = 0; i < gameLogEntries.length; i += BATCH_SIZE) {
        const batch = gameLogEntries.slice(i, i + BATCH_SIZE);
        await this.prisma.$transaction(
          batch.map((entry) => this.prisma.gameLog.create({ data: entry })),
        );
      }
    } catch (error) {
      console.error('Error distributing shares:', error);
    }
  }

  async playerAddMoney(gameId: string, playerId: string, amount: number) {
    //update bank pool for game
    await this.prisma.game.update({
      where: { id: gameId },
      data: {
        bankPoolNumber: {
          decrement: amount,
        },
      },
    });
    return this.prisma.player.update({
      where: { id: playerId },
      data: {
        cashOnHand: {
          increment: amount,
        },
      },
    });
  }

  async playerRemoveMoney(gameId: string, playerId: string, amount: number) {
    //update bank pool for game
    await this.prisma.game.update({
      where: { id: gameId },
      data: {
        bankPoolNumber: {
          increment: amount,
        },
      },
    });
    return this.prisma.player.update({
      where: { id: playerId },
      data: {
        cashOnHand: {
          decrement: amount,
        },
      },
    });
  }

  async haveAllCompaniesActionsResolved(gameId: string) {
    //get current operating round
    const game = await this.gamesService.getGameState(gameId);
    if (!game) {
      throw new Error('Game not found');
    }
    const currentOperatingRound =
      await this.operatingRoundService.operatingRoundWithCompanyActions({
        id: game.currentOperatingRoundId || 0,
      });
    if (!currentOperatingRound) {
      throw new Error('Operating round not found');
    }
    //if there are no company actions, return true
    if (currentOperatingRound.companyActions.length === 0) {
      return true;
    }
    //filter company actions by company status active
    currentOperatingRound.companyActions =
      currentOperatingRound.companyActions.filter(
        (action) => action.Company.status === CompanyStatus.ACTIVE,
      );
    //if there are no company actions, return true
    if (currentOperatingRound.companyActions.length === 0) {
      return true;
    }
    //check if all CompanyAction.resolved
    return currentOperatingRound.companyActions.every(
      (action) => action.resolved,
    );
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
        return this.optionOrdersPending(currentPhase?.stockRoundId || 0);
      default:
        return true;
    }
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
}
