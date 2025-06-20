import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FactoryBlueprintType, OperationMechanicsVersion, Company, Game, FactorySize, Phase } from '@prisma/client';
import { z } from 'zod';

// Export schemas for use in routers
export const CreateFactoryBlueprintSchema = z.object({
  companyId: z.string(),
  gameId: z.string(),
  size: z.nativeEnum(FactorySize),
  resourceTypes: z.array(z.nativeEnum(FactoryBlueprintType)),
  resourceCounts: z.array(z.number().int().positive()),
  slot: z.number().int().min(1).max(5),
  phase: z.number().int().min(1).max(4),
});

export const CreateFactorySchema = z.object({
  companyId: z.string(),
  gameId: z.string(),
  blueprintId: z.string(),
});

type CreateFactoryBlueprintInput = z.infer<typeof CreateFactoryBlueprintSchema>;
type CreateFactoryInput = z.infer<typeof CreateFactorySchema>;

@Injectable()
export class FactoryService {
  constructor(private prisma: PrismaService) {}

  private getRequiredWorkersForSize(size: FactorySize): number {
    switch (size) {
      case FactorySize.FACTORY_I: return 1;
      case FactorySize.FACTORY_II: return 2;
      case FactorySize.FACTORY_III: return 3;
      case FactorySize.FACTORY_IV: return 4;
      default: throw new Error(`Unknown factory size: ${size}`);
    }
  }

  private getMaxCustomersForSize(size: FactorySize): number {
    switch (size) {
      case FactorySize.FACTORY_I: return 3;
      case FactorySize.FACTORY_II: return 4;
      case FactorySize.FACTORY_III: return 5;
      case FactorySize.FACTORY_IV: return 6;
      default: throw new Error(`Unknown factory size: ${size}`);
    }
  }

  private validateResourceRequirements(
    size: FactorySize,
    resourceTypes: FactoryBlueprintType[],
    resourceCounts: number[]
  ): boolean {
    // Must have exactly one sector resource
    const sectorResourceIndex = resourceTypes.findIndex(type => type === FactoryBlueprintType.SECTOR);
    if (sectorResourceIndex === -1 || resourceCounts[sectorResourceIndex] !== 1) {
      return false;
    }

    // Total non-sector resources must match size requirements
    const totalNonSectorResources = resourceCounts.reduce((sum, count, index) => 
      resourceTypes[index] !== FactoryBlueprintType.SECTOR ? sum + count : sum, 0);
    
    switch (size) {
      case FactorySize.FACTORY_I: return totalNonSectorResources === 1;
      case FactorySize.FACTORY_II: return totalNonSectorResources === 2;
      case FactorySize.FACTORY_III: return totalNonSectorResources === 3;
      case FactorySize.FACTORY_IV: return totalNonSectorResources === 4;
      default: return false;
    }
  }

  async createFactoryBlueprint(data: CreateFactoryBlueprintInput) {
    const validated = CreateFactoryBlueprintSchema.parse(data);

    // Validate resource requirements
    if (!this.validateResourceRequirements(
      validated.size,
      validated.resourceTypes,
      validated.resourceCounts
    )) {
      throw new Error('Invalid resource requirements for factory size');
    }

    // Validate slot and phase
    const company = await this.prisma.company.findUnique({
      where: { id: validated.companyId },
      include: { 
        Game: {
          include: {
            Phase: {
              where: {
                id: {
                  equals: undefined // This will be set by the game service
                }
              }
            }
          }
        }
      },
    });

    // Check if slot is already occupied
    const existingBlueprint = await this.prisma.factoryBlueprint.findFirst({
      where: {
        companyId: validated.companyId,
        slot: validated.slot,
      },
    });

    if (existingBlueprint) {
      throw new Error('Factory slot already occupied');
    }

    //get total resource cost
    const resources = await this.prisma.resource.findMany({
      where: {
        gameId: validated.gameId,
      },
    });

    // Calculate total cost by matching resource types with their counts
    let totalCost = 0;
    for (let i = 0; i < validated.resourceTypes.length; i++) {
      const resourceType = validated.resourceTypes[i];
      const resourceCount = validated.resourceCounts[i];
      const resource = resources.find(r => r.type === resourceType);
      if (resource) {
        totalCost += resource.price * resourceCount;
      }
    }

    return this.prisma.factoryBlueprint.create({
      data: {
        ...validated,
        consumers: 0, // Add the missing consumers field
      },
    });
  }

  async createFactory(data: CreateFactoryInput) {
    const validated = CreateFactorySchema.parse(data);

    const blueprint = await this.prisma.factoryBlueprint.findUnique({
      where: { id: validated.blueprintId },
      include: {
        company: true
      }
    });

    if (!blueprint) {
      throw new Error('Factory blueprint not found');
    }

    // Calculate total cost
    const totalCost = await this.calculateFactoryBuildCost(validated.gameId, blueprint);
    if (blueprint.company.cashOnHand < totalCost) {
      throw new Error('Insufficient company cash');
    }

    // Create factory and update company cash in a transaction
    return this.prisma.$transaction(async (tx) => {
      const factory = await tx.factory.create({
        data: {
          blueprintId: validated.blueprintId,
          companyId: validated.companyId,
          gameId: validated.gameId,
          size: blueprint.size,
          workers: 0,
          isOperational: false
        },
      });

      await tx.company.update({
        where: { id: validated.companyId },
        data: { 
          cashOnHand: { 
            decrement: totalCost 
          } 
        },
      });

      return factory;
    });
  }

  async buildFactory(data: z.infer<typeof CreateFactorySchema>) {
    const validated = CreateFactorySchema.parse(data);

    // Get blueprint and verify resources
    const blueprint = await this.prisma.factoryBlueprint.findUnique({
      where: { id: validated.blueprintId },
      include: { company: true },
    });

    if (!blueprint) {
      throw new Error('Blueprint not found');
    }

    // Verify company has enough resources and cash
    const totalCost = await this.calculateFactoryBuildCost(validated.gameId, blueprint);

    if (blueprint.company.cashOnHand < totalCost) {
      throw new Error('Insufficient funds to build factory');
    }

    // Create factory and deduct resources
    return this.prisma.$transaction(async (tx) => {
      // Create factory
      const factory = await tx.factory.create({
        data: {
          companyId: validated.companyId,
          gameId: validated.gameId,
          blueprintId: validated.blueprintId,
          size: blueprint.size,
          workers: 0,
          isOperational: false, // Factory becomes operational next turn
        },
      });

      // Deduct resources and cash
      await this.deductFactoryResources(tx, validated.gameId, blueprint);
      await tx.company.update({
        where: { id: validated.companyId },
        data: { cashOnHand: { decrement: totalCost } },
      });

      return factory;
    });
  }

  private async calculateFactoryBuildCost(gameId: string, blueprint: any) {
    // Get current resource prices
    const resources = await this.prisma.resource.findMany({
      where: { gameId },
    });

    let totalCost = 0;
    blueprint.resourceTypes.forEach((type: FactoryBlueprintType, index: number) => {
      const resource = resources.find(r => r.type === type);
      if (!resource) throw new Error(`Resource type ${type} not found`);
      totalCost += resource.price * blueprint.resourceCounts[index];
    });

    return totalCost;
  }

  private async deductFactoryResources(tx: any, gameId: string, blueprint: any) {
    // Deduct resources from global and sector pools
    for (let i = 0; i < blueprint.resourceTypes.length; i++) {
      const type = blueprint.resourceTypes[i];
      const count = blueprint.resourceCounts[i];

      await tx.resource.updateMany({
        where: { 
          gameId,
          type,
        },
        data: {
          price: { increment: count }, // Price increases as resources are used
        },
      });
    }
  }

  async assignWorkers(factoryId: string, workerCount: number) {
    const factory = await this.prisma.factory.findUnique({
      where: { id: factoryId },
      include: { game: true },
    });

    if (!factory) {
      throw new Error('Factory not found');
    }

    if (workerCount > this.getRequiredWorkersForSize(factory.size)) {
      throw new Error('Exceeds maximum worker capacity');
    }

    // Check if enough workers in pool
    if (factory.game.workforcePool < workerCount) {
      throw new Error('Not enough workers in pool');
    }

    return this.prisma.$transaction(async (tx) => {
      // Update factory workers
      const updatedFactory = await tx.factory.update({
        where: { id: factoryId },
        data: { workers: workerCount },
      });

      // Update game workforce pool
      await tx.game.update({
        where: { id: factory.gameId },
        data: { workforcePool: { decrement: workerCount } },
      });

      return updatedFactory;
    });
  }

  // Get details for a single factory by ID
  async getFactoryDetails(factoryId: string) {
    return this.prisma.factory.findUnique({
      where: { id: factoryId },
      include: {
        blueprint: true,
        company: true,
        resources: true,
      },
    });
  }

  // Get all factories for a company in a game
  async getCompanyFactories(companyId: string, gameId: string) {
    return this.prisma.factory.findMany({
      where: {
        companyId,
        gameId,
      },
      include: {
        blueprint: true,
        resources: true,
      },
    });
  }
} 