import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import {
  Prisma,
  PlayerOrder,
  OrderType,
  Player,
  ShareLocation,
  OrderStatus,
  DistributionStrategy,
  CompanyStatus,
  ContractState,
} from '@prisma/client';
import {
  PlayerOrderConcealed,
  PlayerOrderConcealedWithPlayer,
  PlayerOrderWithCompany,
  PlayerOrderWithPlayerCompany,
  PlayerOrderAllRelations,
  PhaseWithStockRound,
  PlayerOrderWithPlayerRevealed,
  PlayerOrderWithCompanyAndOptionContract,
  PlayerOrderWithShortOrder,
} from '@server/prisma/prisma.types';
import { getPseudoSpend } from '@server/data/helpers';
import { MAX_SHARE_PERCENTAGE } from '@server/data/constants';
import { GameLogService } from '@server/game-log/game-log.service';

@Injectable()
export class PlayerOrderService {
  constructor(
    private prisma: PrismaService,
    private gameLogService: GameLogService,
  ) {}

  async playerOrder(
    playerOrderWhereUniqueInput: Prisma.PlayerOrderWhereUniqueInput,
  ): Promise<PlayerOrder | null> {
    return this.prisma.playerOrder.findUnique({
      where: playerOrderWhereUniqueInput,
    });
  }

  async playerOrders(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PlayerOrderWhereUniqueInput;
    where?: Prisma.PlayerOrderWhereInput;
    orderBy?: Prisma.PlayerOrderOrderByWithRelationInput;
  }): Promise<PlayerOrder[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.playerOrder.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async playerOrdersWithCompany(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PlayerOrderWhereUniqueInput;
    where?: Prisma.PlayerOrderWhereInput;
    orderBy?: Prisma.PlayerOrderOrderByWithRelationInput;
  }): Promise<PlayerOrderWithCompany[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.playerOrder.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        Company: true,
      },
    });
  }

  async playerOrdersWithShortOrder(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PlayerOrderWhereUniqueInput;
    where?: Prisma.PlayerOrderWhereInput;
    orderBy?: Prisma.PlayerOrderOrderByWithRelationInput;
  }): Promise<PlayerOrderWithShortOrder[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.playerOrder.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        ShortOrder: true,
        Player: true,
      },
    });
  }

  async playerOrdersWithCompanyAndOptionContract(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PlayerOrderWhereUniqueInput;
    where?: Prisma.PlayerOrderWhereInput;
    orderBy?: Prisma.PlayerOrderOrderByWithRelationInput;
  }): Promise<PlayerOrderWithCompanyAndOptionContract[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.playerOrder.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        Company: true,
        OptionContract: true,
      },
    });
  }

  async playerOrdersWithPlayerCompany(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PlayerOrderWhereUniqueInput;
    where?: Prisma.PlayerOrderWhereInput;
    orderBy?: Prisma.PlayerOrderOrderByWithRelationInput;
  }): Promise<PlayerOrderWithPlayerCompany[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.playerOrder.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        Company: {
          include: {
            Share: true,
            CompanyActions: true,
          },
        },
        Player: true,
        Sector: true,
        Phase: true,
        GameTurn: true,
      },
    });
  }

  async playerOrdersWithPlayerRevealed(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PlayerOrderWhereUniqueInput;
    where?: Prisma.PlayerOrderWhereInput;
    orderBy?: Prisma.PlayerOrderOrderByWithRelationInput;
  }): Promise<PlayerOrderWithPlayerRevealed[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.playerOrder.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        Company: {
          include: {
            Share: true,
            CompanyActions: true,
          },
        },
        Player: true,
        Sector: true,
        Phase: {
          include: {
            StockRound: true,
          },
        },
        GameTurn: true,
      },
    });
  }

  private concealOrder(order: PlayerOrder): PlayerOrderConcealed {
    const { value, quantity, isSell, orderType, ...concealedOrder } = order;
    return concealedOrder;
  }

  /**
   * Used during stock results round.
   * @param params
   * @returns
   */
  async playerOrdersConcealed(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PlayerOrderWhereUniqueInput;
    where?: Prisma.PlayerOrderWhereInput;
    orderBy?: Prisma.PlayerOrderOrderByWithRelationInput;
  }): Promise<PlayerOrderConcealedWithPlayer[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const orders = await this.prisma.playerOrder.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        Player: true,
        Phase: {
          include: {
            StockRound: true,
          },
        },
      },
    });
    return orders.map(
      (order: PlayerOrder & { Player: Player; Phase: PhaseWithStockRound }) => {
        const concealedOrder = this.concealOrder(order);
        return { ...concealedOrder, Player: order.Player, Phase: order.Phase };
      },
    );
  }

  async playerOrdersAllRelations(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PlayerOrderWhereUniqueInput;
    where?: Prisma.PlayerOrderWhereInput;
    orderBy?: Prisma.PlayerOrderOrderByWithRelationInput;
  }): Promise<PlayerOrderAllRelations[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.playerOrder.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        Company: true,
        Player: true,
        Sector: true,
        ShortOrder: true,
        OptionContract: true,
        GameTurn: true,
      },
    });
  }

  async createPlayerOrder(
    data: Prisma.PlayerOrderCreateInput,
  ): Promise<PlayerOrder> {
    //if the player has already placed a player order this phase, throw an error
    const playerOrder = await this.prisma.playerOrder.findFirst({
      where: {
        playerId: data.Player.connect?.id,
        phaseId: data.Phase.connect?.id,
      },
    });
    if (playerOrder) {
      throw new Error('Player has already placed an order this phase');
    }
    //get game
    const game = await this.prisma.game.findUnique({
      where: { id: data.Game.connect?.id },
    });
    if (!game) {
      throw new Error('Game not found');
    }
    // OrderType Market and BUY is the only type of order that can be placed on location IPO
    if (
      data.location === ShareLocation.IPO &&
      data.orderType !== OrderType.MARKET
    ) {
      throw new Error('Only market orders are allowed on IPO');
    }

    // OrderType Market and BUY is the only type of order that can be placed on location IPO
    if (
      data.location === ShareLocation.IPO &&
      data.orderType === OrderType.MARKET &&
      data.isSell
    ) {
      throw new Error('Cannot sell into IPO');
    }

    const playerId = data.Player.connect?.id;
    const companyId = data.Company.connect?.id;
    const stockRoundId = data.StockRound.connect?.id;

    if (!playerId || !companyId || !stockRoundId) {
      console.error('Invalid data input', data);
      throw new Error('Invalid data input');
    }

    const [player, company, playerOrders] = await this.prisma.$transaction([
      this.prisma.player.findUnique({
        where: { id: playerId },
        include: { Share: true },
      }),
      this.prisma.company.findUnique({
        where: { id: companyId },
      }),
      this.prisma.playerOrder.findMany({
        where: {
          playerId,
          stockRoundId,
        },
        include: { Company: true },
      }),
    ]);

    if (!player || !company) {
      throw new Error('Player or Company not found');
    }

    if (
      data.location === ShareLocation.OPEN_MARKET &&
      company.status != CompanyStatus.ACTIVE
    ) {
      throw new Error(
        'Cannot place an order into the open market on a company that is not active',
      );
    }

    // Filter out fields based on order type
    if (data.orderType === OrderType.MARKET) {
      if (player.marketOrderActions <= 0) {
        throw new Error('Player has no more market order actions');
      }

      const spend = getPseudoSpend(playerOrders);
      let orderValue = 0;
      if (game.distributionStrategy === DistributionStrategy.BID_PRIORITY) {
        if (
          data.location === ShareLocation.IPO &&
          data.value! < company.ipoAndFloatPrice!
        ) {
          throw new Error(
            'Bid value must be greater than or equal to the float price.',
          );
        }
        if (
          data.location === ShareLocation.OPEN_MARKET &&
          data.value! < company.currentStockPrice!
        ) {
          throw new Error(
            'Bid value must be greater than or equal to current stock price.',
          );
        }
        orderValue = data.quantity! * data.value!;
      } else {
        orderValue = data.quantity! * company.currentStockPrice!;
      }

      /**
       * if (data.isSell) {
        const playerShares = player.Share.filter(
          (share) => share.companyId === companyId,
        );
        //TODO: Removing this rule from here for now, instead orders can be placed but will get reject upon resoltuion for this reason during resolveMarketOrders
        // if (!playerShares || playerShares.length < data.quantity!) {
        //   throw new Error('Player does not have enough shares to sell');
        // }
      } else {
        ////TODO: Removing this rule from here for now, instead orders can be placed but will get reject upon resoltuion for this reason during resolveMarketOrders
        // if (spend + orderValue > player.cashOnHand!) {
        //   throw new Error('Player does not have enough cash to place order');
        // }

        //get company with shares TODO: Leaving this open for now, will reject during resolution instead so player can combo.
        // const company = await this.prisma.company.findUnique({
        //   where: { id: companyId },
        //   include: { Share: true },
        // });
        // const playerSharesOfCompany = player.Share.filter(
        //   (share) => share.companyId === companyId,
        // );
        // if (
        //   playerSharesOfCompany.length + data.quantity! >
        //   company?.Share.length! * (MAX_SHARE_PERCENTAGE / 100)
        // ) {
        //   throw new Error(
        //     'This buy would exceed the maximum share percentage.',
        //   );
        // }
      }*/
      if (data.isSell) {
        //check is player has created any other sell orders for this company this stock round
        const playerSellOrders = playerOrders.filter(
          (order) => order.isSell && order.companyId === companyId,
        );
        if (playerSellOrders.length > 0) {
          throw new Error(
            'Player has already placed a sell order for this company this stock round.',
          );
        }
      }
    }
    if (data.orderType === OrderType.LIMIT) {
      //check if player has limit order actions
      if (player.limitOrderActions <= 0) {
        throw new Error('Player has no more limit order actions');
      }
    }
    if (data.orderType === OrderType.SHORT) {
      delete data.isSell;
      //get player
      const playerId = data.Player.connect?.id;
      if (!playerId) {
        throw new Error('Invalid data input');
      }
      const player = await this.prisma.player.findUnique({
        where: { id: playerId },
      });
      if (!player) {
        throw new Error('Player not found');
      }
      //check if player has short order actions
      if (player.shortOrderActions <= 0) {
        throw new Error('Player has no more short order actions');
      }
    }

    if (data.orderType === OrderType.OPTION) {
      if (data.location != ShareLocation.DERIVATIVE_MARKET) {
        throw new Error('Invalid location for option contract');
      }
      if (data.isSell) {
        throw new Error('Cannot sell option contracts');
      }
      if (!data.OptionContract) {
        throw new Error('Invalid option contract');
      }
      //get option contract
      const optionContract = await this.prisma.optionContract.findUnique({
        where: { id: data.OptionContract.connect?.id },
      });
      if (!optionContract) {
        throw new Error('Option contract not found');
      }
      //if option contract not for sale, throw error
      if (optionContract.contractState !== ContractState.FOR_SALE) {
        throw new Error('Option contract not for sale');
      }
      if (game.distributionStrategy === DistributionStrategy.BID_PRIORITY) {
        if (data.value! < optionContract.premium!) {
          throw new Error('Bid value must be greater than or equal to premium');
        }
        if (data.value! > player.cashOnHand!) {
          throw new Error('Player does not have enough cash to place order');
        }
      } else if (player.cashOnHand! < optionContract.premium!) {
        throw new Error('Player does not have enough cash to place order');
      }
    }

    return this.prisma.playerOrder.create({ data });
  }

  async updatePlayerOrder(params: {
    where: Prisma.PlayerOrderWhereUniqueInput;
    data: Prisma.PlayerOrderUpdateInput;
  }): Promise<PlayerOrder> {
    const { where, data } = params;
    return this.prisma.playerOrder.update({
      data,
      where,
    });
  }

  async updateManyPlayerOrders(params: {
    where: Prisma.PlayerOrderWhereInput;
    data: Prisma.PlayerOrderUpdateManyMutationInput;
  }): Promise<Prisma.BatchPayload> {
    const { where, data } = params;
    return this.prisma.playerOrder.updateMany({
      data,
      where,
    });
  }

  async deletePlayerOrder(
    where: Prisma.PlayerOrderWhereUniqueInput,
  ): Promise<PlayerOrder> {
    return this.prisma.playerOrder.delete({
      where,
    });
  }

  /**
   * Trigger limit orders to fill if they are between two prices.
   * @param prevPrice
   * @param currentPrice
   * @param companyId
   * @returns
   */
  async triggerLimitOrdersFilled(
    prevPrice: number,
    currentPrice: number,
    companyId: string,
  ): Promise<PlayerOrder[]> {
    //get all limit orders for this company
    const limitOrders = await this.prisma.playerOrder.findMany({
      where: {
        companyId,
        orderType: OrderType.LIMIT,
        orderStatus: OrderStatus.OPEN,
        OR: [
          // Condition for sell orders
          {
            isSell: true,
            value: {
              gte: currentPrice,
              lt: prevPrice,
            },
          },
          // Condition for buy orders
          {
            isSell: false,
            value: {
              lte: currentPrice,
              gt: prevPrice,
            },
          },
        ],
      },
      include: {
        Player: true,
      },
    });

    //update limit orders
    const updatedOrders = await Promise.all(
      limitOrders.map((order) => {
        this.gameLogService.createGameLog({
          game: { connect: { id: order.gameId } },
          content: `Player ${order.Player.nickname} limit order ${
            order.isSell ? 'SELL' : 'BUY'
          } @${order.value} for company ${companyId} filled`,
        });
        return this.prisma.playerOrder.update({
          where: { id: order.id },
          data: {
            orderStatus: OrderStatus.FILLED_PENDING_SETTLEMENT,
          },
        });
      }),
    );
    return updatedOrders;
  }
}
