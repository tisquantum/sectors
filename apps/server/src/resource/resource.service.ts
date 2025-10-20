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
  // Note: Resources use trackPosition as index into price arrays from constants
  async initializeGameResources(gameId: string): Promise<Resource[]> {
    const initialResources: Prisma.ResourceCreateManyInput[] = [
      // Base resources - start at position 0 (highest price, most available)
      { gameId, type: ResourceType.TRIANGLE, trackType: ResourceTrackType.GLOBAL, trackPosition: 0, price: 0 },
      { gameId, type: ResourceType.SQUARE, trackType: ResourceTrackType.GLOBAL, trackPosition: 0, price: 0 },
      { gameId, type: ResourceType.CIRCLE, trackType: ResourceTrackType.GLOBAL, trackPosition: 0, price: 0 },
      
      // Sector-specific resources - start at position 0
      { gameId, type: ResourceType.MATERIALS, trackType: ResourceTrackType.SECTOR, trackPosition: 0, price: 0 },
      { gameId, type: ResourceType.INDUSTRIALS, trackType: ResourceTrackType.SECTOR, trackPosition: 0, price: 0 },
      { gameId, type: ResourceType.CONSUMER_DISCRETIONARY, trackType: ResourceTrackType.SECTOR, trackPosition: 0, price: 0 },
      { gameId, type: ResourceType.CONSUMER_STAPLES, trackType: ResourceTrackType.SECTOR, trackPosition: 0, price: 0 },
      { gameId, type: ResourceType.CONSUMER_CYCLICAL, trackType: ResourceTrackType.SECTOR, trackPosition: 0, price: 0 },
      { gameId, type: ResourceType.CONSUMER_DEFENSIVE, trackType: ResourceTrackType.SECTOR, trackPosition: 0, price: 0 },
      { gameId, type: ResourceType.ENERGY, trackType: ResourceTrackType.SECTOR, trackPosition: 0, price: 0 },
      { gameId, type: ResourceType.HEALTHCARE, trackType: ResourceTrackType.SECTOR, trackPosition: 0, price: 0 },
      { gameId, type: ResourceType.TECHNOLOGY, trackType: ResourceTrackType.SECTOR, trackPosition: 0, price: 0 },
      { gameId, type: ResourceType.GENERAL, trackType: ResourceTrackType.SECTOR, trackPosition: 0, price: 0 },
    ];

    return this.createManyResources(initialResources);
  }

  // Consume resources and update track position (moves down the track = cheaper prices)
  async consumeResources(gameId: string, resourceConsumptions: { type: ResourceType; count: number }[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const consumption of resourceConsumptions) {
        const resource = await tx.resource.findFirst({
          where: { gameId, type: consumption.type },
        });

        if (!resource) {
          throw new Error(`Resource ${consumption.type} not found`);
        }

        // Move track position down (consumed resources make them cheaper)
        const newTrackPosition = resource.trackPosition + consumption.count;
        
        await tx.resource.update({
          where: { id: resource.id },
          data: {
            trackPosition: newTrackPosition,
          },
        });
      }
    });
  }

  // Add resources back to pool (moves track position up = more expensive)
  async addResources(gameId: string, resourceAdditions: { type: ResourceType; count: number }[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const addition of resourceAdditions) {
        const resource = await tx.resource.findFirst({
          where: { gameId, type: addition.type },
        });

        if (resource) {
          // Move track position up (more resources = more expensive)
          // Don't go below 0
          const newTrackPosition = Math.max(0, resource.trackPosition - addition.count);
          
          await tx.resource.update({
            where: { id: resource.id },
            data: {
              trackPosition: newTrackPosition,
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

  // Update resource prices based on trackPosition using price arrays from constants
  async updateResourcePrices(gameId: string): Promise<void> {
    const resources = await this.resourcesByGame(gameId);
    const { getResourcePriceForResourceType } = await import('@server/data/constants');
    
    for (const resource of resources) {
      const priceArray = getResourcePriceForResourceType(resource.type);
      
      // Get price from array based on trackPosition
      // If position exceeds array length, use last price in array
      const price = priceArray[Math.min(resource.trackPosition, priceArray.length - 1)];
      
      await this.prisma.resource.update({
        where: { id: resource.id },
        data: { price: price || 0 },
      });
    }
  }

  // Get current price for a resource based on its track position
  async getCurrentResourcePrice(resource: Resource): Promise<number> {
    const { getResourcePriceForResourceType } = await import('@server/data/constants');
    const priceArray = getResourcePriceForResourceType(resource.type);
    return priceArray[Math.min(resource.trackPosition, priceArray.length - 1)] || 0;
  }
} 