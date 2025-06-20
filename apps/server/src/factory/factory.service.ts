import { Injectable, Res } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OperationMechanicsVersion, Company, Game, FactorySize, Phase, Resource, ResourceType } from '@prisma/client';
import { z } from 'zod';

// Export schemas for use in routers
export const CreateFactoryBlueprintSchema = z.object({
  companyId: z.string(),
  gameId: z.string(),
  size: z.nativeEnum(FactorySize),
  resourceTypes: z.array(z.nativeEnum(ResourceType)),
  resourceCounts: z.array(z.number().int().positive()),
  slot: z.number().int().min(1).max(5),
  phase: z.number().int().min(1).max(4),
});

export const CreateFactorySchema = z.object({
  companyId: z.string(),
  gameId: z.string(),
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
    resourceTypes: ResourceType[],
    resourceCounts: number[]
  ): boolean {
    return true;
  }

  async createFactory(data: CreateFactoryInput) {
    
  }

  async buildFactory(data: z.infer<typeof CreateFactorySchema>) {
  }

  private async calculateFactoryBuildCost(gameId: string, resources: Resource[]) {
    let totalCost = 0;
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
        resources: true,
      },
    });
  }
} 