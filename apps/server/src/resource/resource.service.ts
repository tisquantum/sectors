import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Resource, ResourceType, ResourceTrackType } from '@prisma/client';

@Injectable()
export class ResourceService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async resource(
    resourceWhereUniqueInput: Prisma.ResourceWhereUniqueInput,
  ): Promise<Resource | null> {
    return this.prisma.resource.findUnique({
      where: resourceWhereUniqueInput,
    });
  }

  async resources(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ResourceWhereUniqueInput;
    where?: Prisma.ResourceWhereInput;
    orderBy?: Prisma.ResourceOrderByWithRelationInput;
  }): Promise<Resource[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.resource.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async resourcesByGame(gameId: string): Promise<Resource[]> {
    return this.prisma.resource.findMany({
      where: { gameId },
      orderBy: { type: 'asc' },
    });
  }

  async resourcesByType(gameId: string, type: ResourceType): Promise<Resource[]> {
    return this.prisma.resource.findMany({
      where: { gameId, type },
    });
  }

  async createResource(data: Prisma.ResourceCreateInput): Promise<Resource> {
    return this.prisma.resource.create({
      data,
    });
  }

  async createManyResources(data: Prisma.ResourceCreateManyInput[]): Promise<Resource[]> {
    await this.prisma.resource.createMany({
      data,
    });
    
    // Since createMany doesn't return the created records, we need to fetch them
    return this.prisma.resource.findMany({
      where: {
        OR: data.map(resource => ({
          gameId: resource.gameId,
          type: resource.type,
        })),
      },
    });
  }

  async updateResource(params: {
    where: Prisma.ResourceWhereUniqueInput;
    data: Prisma.ResourceUpdateInput;
  }): Promise<Resource> {
    const { where, data } = params;
    return this.prisma.resource.update({
      where,
      data,
    });
  }

  async updateManyResources(
    updates: {
      id: string;
      quantity?: number;
      price?: number;
    }[],
  ): Promise<Resource[]> {
    const updatedResources: Resource[] = [];
    
    for (const update of updates) {
      const { id, ...data } = update;
      const updatedResource = await this.prisma.resource.update({
        where: { id },
        data,
      });
      updatedResources.push(updatedResource);
    }
    
    return updatedResources;
  }

  async deleteResource(where: Prisma.ResourceWhereUniqueInput): Promise<Resource> {
    return this.prisma.resource.delete({
      where,
    });
  }

  async deleteManyResources(where: Prisma.ResourceWhereInput): Promise<Prisma.BatchPayload> {
    return this.prisma.resource.deleteMany({
      where,
    });
  }

  async countResources(where?: Prisma.ResourceWhereInput): Promise<number> {
    return this.prisma.resource.count({
      where,
    });
  }

  // Initialize resources for a new game
  async initializeGameResources(gameId: string): Promise<Resource[]> {
    const initialResources: Prisma.ResourceCreateManyInput[] = [
      // Base resources
      { gameId, type: ResourceType.TRIANGLE, trackType: ResourceTrackType.GLOBAL, quantity: 20, price: 10.0 },
      { gameId, type: ResourceType.SQUARE, trackType: ResourceTrackType.GLOBAL, quantity: 15, price: 15.0 },
      { gameId, type: ResourceType.CIRCLE, trackType: ResourceTrackType.GLOBAL, quantity: 10, price: 20.0 },
      
      // Sector-specific resources
      { gameId, type: ResourceType.MATERIALS, trackType: ResourceTrackType.SECTOR, quantity: 12, price: 12.0 },
      { gameId, type: ResourceType.INDUSTRIALS, trackType: ResourceTrackType.SECTOR, quantity: 12, price: 12.0 },
      { gameId, type: ResourceType.CONSUMER_DISCRETIONARY, trackType: ResourceTrackType.SECTOR, quantity: 12, price: 12.0 },
      { gameId, type: ResourceType.CONSUMER_STAPLES, trackType: ResourceTrackType.SECTOR, quantity: 12, price: 12.0 },
      { gameId, type: ResourceType.CONSUMER_CYCLICAL, trackType: ResourceTrackType.SECTOR, quantity: 12, price: 12.0 },
      { gameId, type: ResourceType.CONSUMER_DEFENSIVE, trackType: ResourceTrackType.SECTOR, quantity: 12, price: 12.0 },
      { gameId, type: ResourceType.ENERGY, trackType: ResourceTrackType.SECTOR, quantity: 12, price: 12.0 },
      { gameId, type: ResourceType.HEALTHCARE, trackType: ResourceTrackType.SECTOR, quantity: 12, price: 12.0 },
      { gameId, type: ResourceType.TECHNOLOGY, trackType: ResourceTrackType.SECTOR, quantity: 12, price: 12.0 },
      { gameId, type: ResourceType.GENERAL, trackType: ResourceTrackType.SECTOR, quantity: 12, price: 12.0 },
    ];

    return this.createManyResources(initialResources);
  }

  // Consume resources and update prices
  async consumeResources(gameId: string, resourceConsumptions: { type: ResourceType; quantity: number }[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const consumption of resourceConsumptions) {
        const resource = await tx.resource.findFirst({
          where: { gameId, type: consumption.type },
        });

        if (resource && resource.quantity >= consumption.quantity) {
          // Calculate price increase based on consumption
          const priceIncrease = consumption.quantity * 0.5;
          
          await tx.resource.update({
            where: { id: resource.id },
            data: {
              quantity: { decrement: consumption.quantity },
              price: { increment: priceIncrease },
            },
          });
        } else {
          throw new Error(`Insufficient resources of type ${consumption.type}`);
        }
      }
    });
  }

  // Add resources to pool (e.g., from production or events)
  async addResources(gameId: string, resourceAdditions: { type: ResourceType; quantity: number }[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const addition of resourceAdditions) {
        const resource = await tx.resource.findFirst({
          where: { gameId, type: addition.type },
        });

        if (resource) {
          // Calculate price decrease based on increased supply
          const priceDecrease = addition.quantity * 0.3;
          
          await tx.resource.update({
            where: { id: resource.id },
            data: {
              quantity: { increment: addition.quantity },
              price: { decrement: Math.max(0, priceDecrease) }, // Don't go below 0
            },
          });
        }
      }
    });
  }

  // Get resource price for a specific type
  async getResourcePrice(gameId: string, type: ResourceType): Promise<number> {
    const resource = await this.prisma.resource.findFirst({
      where: { gameId, type },
    });
    return resource?.price || 0;
  }

  // Get total resource value in a game
  async getTotalResourceValue(gameId: string): Promise<number> {
    const resources = await this.resourcesByGame(gameId);
    return resources.reduce((total, resource) => {
      return total + (resource.quantity * resource.price);
    }, 0);
  }

  // Update resource prices based on supply and demand
  async updateResourcePrices(gameId: string): Promise<void> {
    const resources = await this.resourcesByGame(gameId);
    
    for (const resource of resources) {
      let newPrice = resource.price;
      
      // Adjust price based on quantity (supply)
      if (resource.quantity < 5) {
        newPrice *= 1.2; // Price increases when supply is low
      } else if (resource.quantity > 20) {
        newPrice *= 0.9; // Price decreases when supply is high
      }
      
      // Ensure price doesn't go below minimum
      newPrice = Math.max(newPrice, 1.0);
      
      await this.prisma.resource.update({
        where: { id: resource.id },
        data: { price: newPrice },
      });
    }
  }
} 