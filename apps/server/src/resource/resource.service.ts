import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Resource, ResourceType, ResourceTrackType } from '@prisma/client';
import { getResourcePriceForResourceType } from '@server/data/constants';
import { GameLogService } from '@server/game-log/game-log.service';

@Injectable()
export class ResourceService {
  constructor(
    private prisma: PrismaService,
    private gameLogService: GameLogService,
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

  /**
   * Get all resources for a game (alias for resourcesByGame)
   */
  async getGameResources(gameId: string): Promise<Resource[]> {
    return this.resourcesByGame(gameId);
  }

  /**
   * Get a single resource by type (returns first match or null)
   */
  async getResourceByType(gameId: string, type: ResourceType): Promise<Resource | null> {
    const resources = await this.resourcesByType(gameId, type);
    return resources.length > 0 ? resources[0] : null;
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
  // NOTE: Sector resources (ResourceTrackType.SECTOR) are NOT updated when consumed
  // They only increase in value through research actions
  async consumeResources(
    gameId: string, 
    resourceConsumptions: { type: ResourceType; count: number }[],
    reason?: string,
  ): Promise<void> {
    const trackPositionChanges: Array<{ type: ResourceType; oldPosition: number; newPosition: number; count: number }> = [];

    await this.prisma.$transaction(async (tx) => {
      for (const consumption of resourceConsumptions) {
        const resource = await tx.resource.findFirst({
          where: { gameId, type: consumption.type },
        });

        if (!resource) {
          // Log warning and skip - resource type might not be initialized for this game
          // This can happen if a resource type like GENERAL is used but wasn't created during game initialization
          console.warn(`Resource ${consumption.type} not found for game ${gameId}. Skipping consumption.`);
          continue;
        }

        // Skip sector resources - they only increase via research, not consumption
        if (resource.trackType === ResourceTrackType.SECTOR) {
          console.log(`Skipping track position update for sector resource ${consumption.type} - sector resources only increase via research`);
          continue;
        }

        // Move track position down (consumed resources make them cheaper)
        const oldTrackPosition = resource.trackPosition;
        const newTrackPosition = resource.trackPosition + consumption.count;
        
        await tx.resource.update({
          where: { id: resource.id },
          data: {
            trackPosition: newTrackPosition,
          },
        });

        // Track changes for logging after transaction
        trackPositionChanges.push({
          type: consumption.type,
          oldPosition: oldTrackPosition,
          newPosition: newTrackPosition,
          count: consumption.count,
        });
      }
    });

    // Log trackPosition changes after transaction completes
    for (const change of trackPositionChanges) {
      if (reason) {
        await this.gameLogService.createGameLog({
          game: { connect: { id: gameId } },
          content: `${change.type} resource trackPosition: ${change.oldPosition} → ${change.newPosition} (${change.count} consumed). Reason: ${reason}`,
        });
      } else {
        await this.gameLogService.createGameLog({
          game: { connect: { id: gameId } },
          content: `${change.type} resource trackPosition: ${change.oldPosition} → ${change.newPosition} (${change.count} consumed)`,
        });
      }
    }
  }

  // Add resources back to pool (moves track position up = more expensive)
  async addResources(
    gameId: string, 
    resourceAdditions: { type: ResourceType; count: number }[],
    reason?: string,
  ): Promise<void> {
    const trackPositionChanges: Array<{ type: ResourceType; oldPosition: number; newPosition: number; count: number }> = [];

    await this.prisma.$transaction(async (tx) => {
      for (const addition of resourceAdditions) {
        const resource = await tx.resource.findFirst({
          where: { gameId, type: addition.type },
        });

        if (resource) {
          // Move track position up (more resources = more expensive)
          // Don't go below 0
          const oldTrackPosition = resource.trackPosition;
          const newTrackPosition = Math.max(0, resource.trackPosition - addition.count);
          
          await tx.resource.update({
            where: { id: resource.id },
            data: {
              trackPosition: newTrackPosition,
            },
          });

          // Track changes for logging after transaction (only if it actually changed)
          if (newTrackPosition !== oldTrackPosition) {
            trackPositionChanges.push({
              type: addition.type,
              oldPosition: oldTrackPosition,
              newPosition: newTrackPosition,
              count: addition.count,
            });
          }
        }
      }
    });

    // Log trackPosition changes after transaction completes
    for (const change of trackPositionChanges) {
      if (reason) {
        await this.gameLogService.createGameLog({
          game: { connect: { id: gameId } },
          content: `${change.type} resource trackPosition: ${change.oldPosition} → ${change.newPosition} (${change.count} added back). Reason: ${reason}`,
        });
      } else {
        await this.gameLogService.createGameLog({
          game: { connect: { id: gameId } },
          content: `${change.type} resource trackPosition: ${change.oldPosition} → ${change.newPosition} (${change.count} added back)`,
        });
      }
    }
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
    
    // OPTIMIZATION: Batch update all resources in a single transaction
    if (resources.length === 0) {
      return;
    }

    await this.prisma.$transaction(
      resources.map(resource => {
        const priceArray = getResourcePriceForResourceType(resource.type);
        // Get price from array based on trackPosition
        // If position exceeds array length, use last price in array
        const price = priceArray[Math.min(resource.trackPosition, priceArray.length - 1)] || 0;
        
        return this.prisma.resource.update({
          where: { id: resource.id },
          data: { price },
        });
      })
    );
  }

  // Get current price for a resource based on its track position
  async getCurrentResourcePrice(resource: Resource): Promise<number> {
    const priceArray = getResourcePriceForResourceType(resource.type);
    return priceArray[Math.min(resource.trackPosition, priceArray.length - 1)] || 0;
  }
} 