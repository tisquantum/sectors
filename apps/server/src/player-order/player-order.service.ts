import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, PlayerOrder, OrderType, Player } from '@prisma/client';
import {
  PlayerOrderConcealed,
  PlayerOrderConcealedWithPlayer,
} from '@server/prisma/prisma.types';

@Injectable()
export class PlayerOrderService {
  constructor(private prisma: PrismaService) {}

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

  private concealOrder(order: PlayerOrder): PlayerOrderConcealed {
    const { term, value, quantity, isSell, orderType, ...concealedOrder } =
      order;
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
      },
    });
    return orders.map((order: PlayerOrder & { Player: Player }) => {
      const concealedOrder = this.concealOrder(order);
      return { ...concealedOrder, Player: order.Player };
    });
  }

  async createPlayerOrder(
    data: Prisma.PlayerOrderCreateInput,
  ): Promise<PlayerOrder> {
    //given the order type, filter out the fields that are not needed
    if (data.orderType === OrderType.MARKET) {
      delete data.term;
      delete data.value;
    }
    if (data.orderType === OrderType.LIMIT) {
      delete data.quantity;
      delete data.term;
    }
    if (data.orderType === OrderType.SHORT) {
      delete data.value;
      delete data.isSell;
    }
    return this.prisma.playerOrder.create({
      data,
    });
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

  async deletePlayerOrder(
    where: Prisma.PlayerOrderWhereUniqueInput,
  ): Promise<PlayerOrder> {
    return this.prisma.playerOrder.delete({
      where,
    });
  }
}
