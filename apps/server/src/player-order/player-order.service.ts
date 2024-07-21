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
          },
        },
        Player: true,
        Sector: true,
        Phase: true,
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
          },
        },
        Player: true,
        Sector: true,
        Phase: {
          include: {
            StockRound: true,
          },
        },
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

    // Filter out fields based on order type
    if (data.orderType === OrderType.MARKET) {
      const playerId = data.Player.connect?.id;
      const companyId = data.Company.connect?.id;
      const stockRoundId = data.StockRound.connect?.id;

      if (!playerId || !companyId || !stockRoundId) {
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

      if (player.marketOrderActions <= 0) {
        throw new Error('Player has no more market order actions');
      }

      const spend = getPseudoSpend(playerOrders);
      let orderValue = 0;
      if (game.distributionStrategy === DistributionStrategy.BID_PRIORITY) {
        if (data.value! < company.currentStockPrice!) {
          throw new Error(
            'Bid value must be greater than or equal to current stock price',
          );
        }
        orderValue = data.quantity! * data.value!;
      } else {
        orderValue = data.quantity! * company.currentStockPrice!;
      }

      if (data.isSell) {
        const playerShares = player.Share.filter(
          (share) => share.companyId === companyId,
        );
        if (!playerShares || playerShares.length < data.quantity!) {
          throw new Error('Player does not have enough shares to sell');
        }
      } else {
        if (spend + orderValue > player.cashOnHand!) {
          throw new Error('Player does not have enough cash to place order');
        }

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
      }
    }

    if (data.orderType === OrderType.LIMIT) {
      delete data.quantity;
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

    //update limit orders to market orders
    const updatedOrders = await Promise.all(
      limitOrders.map((order) => {
        this.gameLogService.createGameLog({
          game: { connect: { id: order.gameId } },
          content: `Player ${order.Player.nickname} limit order ${order.isSell ? 'SELL' : 'BUY'} @${order.value} for company ${companyId} filled`,
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
