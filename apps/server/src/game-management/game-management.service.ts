import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { PlayersService } from '@server/players/players.service';
import {
  Game,
  OrderStatus,
  OrderType,
  Phase,
  PhaseName,
  Player,
  PlayerOrder,
  Prisma,
  RoundType,
  Sector,
  Share,
  ShareLocation,
  StockRound,
} from '@prisma/client';
import { GamesService } from '@server/games/games.service';
import { CompanyService } from '@server/company/company.service';
import { SectorService } from '@server/sector/sector.service';
import { gameDataJson } from '@server/data/gameData';
import { StartGameInput } from './game-management.interface';
import {
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
} from '@server/data/constants';
import { TimerService } from '@server/timer/timer.service';
import {
  calculateMarginAccountMinimum,
  calculateStepsAndRemainder,
  determineFloatPrice,
  determineNextGamePhase,
  getNextTier,
} from '@server/data/helpers';
import { PusherService } from 'nestjs-pusher';
import { EVENT_NEW_PHASE, getGameChannelId } from '@server/pusher/pusher.types';
import { OperatingRoundService } from '@server/operating-round/operating-round.service';
import { ShareService } from '@server/share/share.service';

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
  ) {}

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
      currentTurn: 0,
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
        marketingPrice: sector.marketingPrice,
        basePrice: sector.basePrice,
        floatNumberMin: sector.floatNumberMin,
        floatNumberMax: sector.floatNumberMax,
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
          unitPrice: company.unitPrice,
          throughput: company.throughput,
          sectorId: sector.name, //map to name at first then match to supabase for id
          gameId: game.id,
          insolvent: company.insolvent,
        }));
      });

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
          return {
            ...company,
            ipoAndFloatPrice: ipoPrice,
            currentStockPrice: ipoPrice,
            gameId: game.id,
            sectorId: sector.id,
          };
        });
        const companies =
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
      try {
        await this.startStockRound(game.id);
      } catch (error) {
        console.error('Error starting game:', error);
        throw new Error('Failed to start the stock round.');
      }
      return game;
    } catch (error) {
      console.error('Error starting game:', error);
      throw new Error('Failed to start the game');
    }
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

  public async startStockRound(gameId: string): Promise<StockRound | null> {
    const stockRound = await this.stockRoundService.createStockRound({
      Game: { connect: { id: gameId } },
    });
    await this.startPhase({
      gameId,
      stockRoundId: stockRound.id,
      phaseName: PhaseName.STOCK_MEET,
      roundType: RoundType.STOCK,
    });
    return stockRound;
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
  private async startPhase({
    gameId,
    phaseName,
    roundType,
    stockRoundId,
    operatingRoundId,
  }: {
    gameId: string;
    phaseName: PhaseName;
    roundType: RoundType;
    stockRoundId?: number;
    operatingRoundId?: number;
  }) {
    console.log('Starting phase:', phaseName);
    this.pusherService.trigger(getGameChannelId(gameId), 'phase-started', {
      phaseName,
    });
    const phase = await this.phaseService.createPhase({
      name: phaseName,
      phaseTime: phaseTimes[phaseName],
      Game: { connect: { id: gameId } },
      StockRound: stockRoundId ? { connect: { id: stockRoundId } } : undefined,
      OperatingRound: operatingRoundId
        ? { connect: { id: operatingRoundId } }
        : undefined,
    });
    if (roundType === RoundType.STOCK) {
      const stockRound = await this.stockRoundService.createStockRound({
        Game: { connect: { id: gameId } },
      });
    } else {
      const operatingRound =
        await this.operatingRoundService.createOperatingRound({
          Game: { connect: { id: gameId } },
        });
    }

    //handle phase
    this.handlePhase(phase);

    const game = await this.gamesService.updateGameState({
      where: { id: gameId },
      data: {
        currentPhaseId: phase.id,
        currentStockRoundId: stockRoundId,
        currentOperatingRoundId: operatingRoundId,
      },
    });

    this.pusherService.trigger(getGameChannelId(gameId), EVENT_NEW_PHASE, {
      game,
      phase,
    });

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

  async handlePhase(phase: Phase) {
    switch (phase.name) {
      case PhaseName.STOCK_RESOLVE_LIMIT_ORDER:
        this.resolveLimitOrders(phase);
        break;
      case PhaseName.STOCK_RESOLVE_MARKET_ORDER:
        //resolve stock round
        this.resolveMarketOrders(phase);
        break;
      case PhaseName.STOCK_SHORT_ORDER_INTEREST:
        this.resolveShortOrdersInterest(phase);
        break;
      case PhaseName.STOCK_RESOLVE_OPEN_SHORT_ORDER:
        this.resolveOpenShortOrders(phase);
        break;
      default:
        return;
    }
  }

  /**
   * Limit orders are filled on the fly as the game progresses during operations and other stock round actions,
   * when limit orders are resolved, we fulfill any orders pending settlement by collecting money and distributing shares for buys 
   * or paying out money and removing shares for sells. 
   * @param phase 
   */
  async resolveLimitOrders(phase: Phase) {
    if (phase.stockRoundId) {
      const playerOrders: PlayerOrderWithPlayerCompany[] =
        await this.prisma.playerOrder.findMany({
          where: { stockRoundId: phase.stockRoundId },
          include: {
            Company: true,
            Player: true,
            Sector: true,
          },
        });
      if (!playerOrders) {
        throw new Error('Stock round not found');
      }
      //filter all limit orders that are pending settlement
      const limitOrders = playerOrders.filter(
        (order) =>
          order.orderType === OrderType.LIMIT &&
          order.orderStatus == OrderStatus.FILLED_PENDING_SETTLEMENT,
      );
      //pay out all limit orders that are buys by increasing cash on hand by the current stock price and adding share to portfolio
      limitOrders.forEach(async (order) => {
        if (!order.Company) {
          throw new Error('Company not found');
        }
        if (order.isSell) {
          //sell order ( a limit order represents 1 share only )
          await this.prisma.player.update({
            where: { id: order.playerId },
            data: {
              cashOnHand: {
                increment: order.value || 0,
              },
            },
          });

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
          await this.shareService.updateShare({
            where: { id: share.id },
            data: { location: ShareLocation.OPEN_MARKET },
          });
        } else {
          //buy order
          await this.prisma.player.update({
            where: { id: order.playerId },
            data: {
              cashOnHand: {
                decrement: order.value || 0,
              },
            },
          });

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
          this.prisma.player.update({
            where: { id: order.playerId },
            data: {
              cashOnHand: {
                decrement:
                  shortOrder.borrowRate *
                  (shortOrder.shortSalePrice * shortOrder.Share.length),
              },
            },
          });
        }
      });
    }
  }

  async resolveOpenShortOrders(phase: Phase) {
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
      shortOrders.forEach(async (order) => {
        //check if the short order has already been created
        if (!order.ShortOrder) {
          const shortInitialTotalValue =
            (order.quantity || 0) * (order.Company.currentStockPrice || 0);
          //see if the player has enough capital to create a margin account
          if (shortInitialTotalValue > order.Player.cashOnHand) {
            //reject order
            await this.prisma.playerOrder.update({
              where: { id: order.id },
              data: {
                orderStatus: OrderStatus.REJECTED,
              },
            });
            throw new Error(
              'Player does not have enough cash in margin account to place order',
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
        }
      });
    }
  }
  async resolveMarketOrders(phase: Phase) {
    if (phase.stockRoundId) {
      const playerOrders: PlayerOrderWithPlayerCompany[] =
        await this.prisma.playerOrder.findMany({
          where: { stockRoundId: phase.stockRoundId },
          include: {
            Company: true,
            Player: true,
            Sector: true,
          },
        });
      if (!playerOrders) {
        throw new Error('Stock round not found');
      }
      //filter all market orders
      const marketOrders = playerOrders.filter(
        (order) => order.orderType === OrderType.MARKET,
      );
      //group market orders by company
      const groupedMarketOrders = marketOrders.reduce<{
        [key: string]: PlayerOrderWithPlayerCompany[];
      }>((acc, order) => {
        if (!acc[order.companyId]) {
          acc[order.companyId] = [];
        }
        acc[order.companyId].push(order);
        return acc;
      }, {});
      //find the net difference of buys and sells between market orders of a company
      const netDifferences = Object.entries(groupedMarketOrders).map(
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
      netDifferences.forEach(async ({ companyId, netDifference, orders }) => {
        let currentTier = orders[0].Company.stockTier;
        let currentTierSize = stockTierChartRanges.find(
          (stockTierChartRange) => stockTierChartRange.tier === currentTier,
        );

        const { steps, newTierSharesFulfilled, newTier, newSharePrice } =
          calculateStepsAndRemainder(
            netDifference,
            orders[0].Company.tierSharesFulfilled,
            currentTierSize?.fillSize ?? 0,
            orders[0].Company.currentStockPrice ?? 0,
          );
        //update company shares
        this.companyService.updateCompany({
          where: { id: companyId },
          data: {
            tierSharesFulfilled: newTierSharesFulfilled,
            stockTier: newTier,
            currentStockPrice: newSharePrice,
          },
        });
        //resolve all sell orders by updating player cash and share count
        await Promise.all(
          orders.map(async (order) => {
            if (order.isSell) {
              const sellAmount = order.quantity || 0;
              const sharePrice = order.Company.currentStockPrice || 0;
              const playerActualSharesOwned = await this.shareService.shares({
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

              await this.prisma.player.update({
                where: { id: order.playerId },
                data: {
                  cashOnHand: {
                    increment: sharesToSell * sharePrice,
                  },
                },
              });

              const sharesToUpdate = await this.prisma.share.findMany({
                where: {
                  playerId: order.playerId,
                  companyId,
                  location: ShareLocation.PLAYER,
                },
                take: sellAmount,
              });

              const shareIds = sharesToUpdate.map((share) => share.id);

              await this.shareService.updateManyShares({
                where: {
                  id: { in: shareIds },
                },
                data: {
                  location: ShareLocation.OPEN_MARKET,
                },
              });
            }
          }),
        );
        //iterate over grouped by market orders to distribute shares for potential buyers
        // distribute shares for buy orders
        const buyOrders = orders.filter((order) => !order.isSell);
        const totalSharesToDistribute = netDifference;
        let remainingShares = totalSharesToDistribute;

        // First pass: Distribute shares based on earliest orders
        for (const order of buyOrders) {
          if (remainingShares <= 0) break;
          const sharesToGive = Math.min(order.quantity || 0, remainingShares);
          await this.shareService.updateManyShares({
            where: {
              playerId: order.playerId,
              companyId,
              location: ShareLocation.OPEN_MARKET,
            },
            data: {
              location: ShareLocation.PLAYER,
            },
          });
          remainingShares -= sharesToGive;
        }

        // Second pass: Evenly distribute remaining shares
        if (remainingShares > 0) {
          const numBuyers = buyOrders.length;
          const sharesPerBuyer = Math.floor(remainingShares / numBuyers);
          for (const order of buyOrders) {
            if (sharesPerBuyer <= 0) break;
            await this.shareService.updateManyShares({
              where: {
                playerId: order.playerId,
                companyId,
                location: ShareLocation.OPEN_MARKET,
              },
              data: {
                location: ShareLocation.PLAYER,
              },
            });
            remainingShares -= sharesPerBuyer;
          }
        }

        // Third pass: Lottery system for remaining shares
        if (remainingShares > 0) {
          while (remainingShares > 0 && buyOrders.length > 0) {
            const randomIndex = Math.floor(Math.random() * buyOrders.length);
            const order = buyOrders[randomIndex];
            await this.shareService.updateManyShares({
              where: {
                playerId: order.playerId,
                companyId,
                location: ShareLocation.OPEN_MARKET,
              },
              data: {
                location: ShareLocation.PLAYER,
              },
            });
            remainingShares -= 1;
            buyOrders.splice(randomIndex, 1); // Remove the order from the list
          }
        }
      });
    }
  }
}
