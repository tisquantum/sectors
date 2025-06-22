import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, FactoryConstructionOrder, FactorySize, ResourceType } from '@prisma/client';

@Injectable()
export class FactoryConstructionOrderService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async factoryConstructionOrder(
    factoryConstructionOrderWhereUniqueInput: Prisma.FactoryConstructionOrderWhereUniqueInput,
  ): Promise<FactoryConstructionOrder | null> {
    return this.prisma.factoryConstructionOrder.findUnique({
      where: factoryConstructionOrderWhereUniqueInput,
    });
  }

  async factoryConstructionOrderWithRelations(
    factoryConstructionOrderWhereUniqueInput: Prisma.FactoryConstructionOrderWhereUniqueInput,
  ): Promise<FactoryConstructionOrder | null> {
    return this.prisma.factoryConstructionOrder.findUnique({
      where: factoryConstructionOrderWhereUniqueInput,
      include: {
        player: true,
        company: true,
        game: true,
        phase: true,
      },
    });
  }

  async factoryConstructionOrders(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.FactoryConstructionOrderWhereUniqueInput;
    where?: Prisma.FactoryConstructionOrderWhereInput;
    orderBy?: Prisma.FactoryConstructionOrderOrderByWithRelationInput;
  }): Promise<FactoryConstructionOrder[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.factoryConstructionOrder.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async factoryConstructionOrdersWithRelations(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.FactoryConstructionOrderWhereUniqueInput;
    where?: Prisma.FactoryConstructionOrderWhereInput;
    orderBy?: Prisma.FactoryConstructionOrderOrderByWithRelationInput;
  }): Promise<FactoryConstructionOrder[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.factoryConstructionOrder.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        player: true,
        company: true,
        game: true,
        phase: true,
      },
    });
  }

  async factoryConstructionOrdersByGame(gameId: string): Promise<FactoryConstructionOrder[]> {
    return this.prisma.factoryConstructionOrder.findMany({
      where: {
        gameId,
      },
      include: {
        player: true,
        company: true,
        phase: true,
      },
    });
  }

  async factoryConstructionOrdersByCompany(companyId: string): Promise<FactoryConstructionOrder[]> {
    return this.prisma.factoryConstructionOrder.findMany({
      where: {
        companyId,
      },
      include: {
        player: true,
        game: true,
        phase: true,
      },
    });
  }

  async factoryConstructionOrdersByPhase(phaseId: string): Promise<FactoryConstructionOrder[]> {
    return this.prisma.factoryConstructionOrder.findMany({
      where: {
        phaseId,
      },
      include: {
        player: true,
        company: true,
        game: true,
      },
    });
  }

  async factoryConstructionOrdersByPlayer(playerId: string): Promise<FactoryConstructionOrder[]> {
    return this.prisma.factoryConstructionOrder.findMany({
      where: {
        playerId,
      },
      include: {
        company: true,
        game: true,
        phase: true,
      },
    });
  }

  async createFactoryConstructionOrder(
    data: Prisma.FactoryConstructionOrderCreateInput,
  ): Promise<FactoryConstructionOrder> {
    return this.prisma.factoryConstructionOrder.create({
      data,
    });
  }

  async createManyFactoryConstructionOrders(
    data: Prisma.FactoryConstructionOrderCreateManyInput[],
  ): Promise<FactoryConstructionOrder[]> {
    const createdOrders = await this.prisma.factoryConstructionOrder.createMany({
      data,
    });
    
    // Since createMany doesn't return the created records, we need to fetch them
    // This is a limitation of Prisma's createMany
    return this.prisma.factoryConstructionOrder.findMany({
      where: {
        OR: data.map(order => ({
          companyId: order.companyId,
          gameId: order.gameId,
          phaseId: order.phaseId,
          playerId: order.playerId,
          size: order.size,
        })),
      },
    });
  }

  async updateFactoryConstructionOrder(params: {
    where: Prisma.FactoryConstructionOrderWhereUniqueInput;
    data: Prisma.FactoryConstructionOrderUpdateInput;
  }): Promise<FactoryConstructionOrder> {
    const { where, data } = params;
    return this.prisma.factoryConstructionOrder.update({
      where,
      data,
    });
  }

  async updateManyFactoryConstructionOrders(
    updates: {
      id: string;
      size?: FactorySize;
      resourceTypes?: ResourceType[];
    }[],
  ): Promise<FactoryConstructionOrder[]> {
    const updatedOrders: FactoryConstructionOrder[] = [];
    
    for (const update of updates) {
      const { id, ...data } = update;
      const updatedOrder = await this.prisma.factoryConstructionOrder.update({
        where: { id },
        data,
      });
      updatedOrders.push(updatedOrder);
    }
    
    return updatedOrders;
  }

  async deleteFactoryConstructionOrder(
    where: Prisma.FactoryConstructionOrderWhereUniqueInput,
  ): Promise<FactoryConstructionOrder> {
    return this.prisma.factoryConstructionOrder.delete({
      where,
    });
  }

  async deleteManyFactoryConstructionOrders(
    where: Prisma.FactoryConstructionOrderWhereInput,
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.factoryConstructionOrder.deleteMany({
      where,
    });
  }

  async countFactoryConstructionOrders(
    where?: Prisma.FactoryConstructionOrderWhereInput,
  ): Promise<number> {
    return this.prisma.factoryConstructionOrder.count({
      where,
    });
  }

  async countFactoryConstructionOrdersByGame(gameId: string): Promise<number> {
    return this.prisma.factoryConstructionOrder.count({
      where: {
        gameId,
      },
    });
  }

  async countFactoryConstructionOrdersByCompany(companyId: string): Promise<number> {
    return this.prisma.factoryConstructionOrder.count({
      where: {
        companyId,
      },
    });
  }

  async countFactoryConstructionOrdersByPhase(phaseId: string): Promise<number> {
    return this.prisma.factoryConstructionOrder.count({
      where: {
        phaseId,
      },
    });
  }
} 