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
  size: z.nativeEnum(FactorySize),
  resourceTypes: z.array(z.nativeEnum(ResourceType)),
});

type CreateFactoryBlueprintInput = z.infer<typeof CreateFactoryBlueprintSchema>;
type CreateFactoryInput = z.infer<typeof CreateFactorySchema>;

@Injectable()
export class FactoryService {
  constructor(private prisma: PrismaService) {}

  private getRequiredWorkersForSize(size: FactorySize): number {
    switch (size) {
      case FactorySize.FACTORY_I: return 2;
      case FactorySize.FACTORY_II: return 4;
      case FactorySize.FACTORY_III: return 6;
      case FactorySize.FACTORY_IV: return 8;
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
    const { companyId, gameId, size, resourceTypes } = data;

    // Get company to determine sector
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { Sector: true },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    // Get next available slot for the company
    const existingFactories = await this.prisma.factory.findMany({
      where: { companyId, gameId },
      orderBy: { slot: 'desc' },
      take: 1,
    });

    const nextSlot = existingFactories.length > 0 ? existingFactories[0].slot + 1 : 1;

    // Check if company has reached factory limit
    const factoryCount = await this.prisma.factory.count({
      where: { companyId, gameId },
    });

    const maxFactories = this.getMaxFactoriesForCompany(company);
    if (factoryCount >= maxFactories) {
      throw new Error(`Company has reached maximum factory limit of ${maxFactories}`);
    }

    // Check if enough workers in pool
    const requiredWorkers = this.getRequiredWorkersForSize(size);
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new Error('Game not found');
    }

    if (game.workers < requiredWorkers) {
      throw new Error(`Not enough workers in pool. Required: ${requiredWorkers}, Available: ${game.workers}`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Create factory
      const factory = await tx.factory.create({
        data: {
          companyId,
          sectorId: company.sectorId,
          gameId,
          size,
          workers: requiredWorkers,
          slot: nextSlot,
          isOperational: false,
          resourceTypes,
        },
      });

      // Deduct workers from game pool
      await tx.game.update({
        where: { id: gameId },
        data: { workers: { decrement: requiredWorkers } },
      });

      // Consume resources and update prices
      await this.consumeResourcesForFactory(tx, gameId, resourceTypes);

      return factory;
    });
  }

  private async consumeResourcesForFactory(tx: any, gameId: string, resourceTypes: ResourceType[]) {
    // For each resource type, consume one unit and increase price
    for (const resourceType of resourceTypes) {
      const resource = await tx.resource.findFirst({
        where: { gameId, type: resourceType },
      });

      if (resource) {
        // Increase price as resources are consumed
        await tx.resource.update({
          where: { id: resource.id },
          data: {
            quantity: { decrement: 1 },
            price: { increment: 0.5 }, // Price increases as supply decreases
          },
        });
      }
    }
  }

  private getMaxFactoriesForCompany(company: Company): number {
    // Base on company tier
    switch (company.companyTier) {
      case 'INCUBATOR': return 1;
      case 'STARTUP': return 2;
      case 'GROWTH': return 3;
      case 'ESTABLISHED': return 4;
      case 'ENTERPRISE': return 5;
      case 'CONGLOMERATE': return 6;
      case 'TITAN': return 7;
      default: return 1;
    }
  }

  async buildFactory(data: z.infer<typeof CreateFactorySchema>) {
    return this.createFactory(data);
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
    if (factory.game.workers < workerCount) {
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
        data: { workers: { decrement: workerCount } },
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
        Sector: true,
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
        Sector: true,
      },
    });
  }

  // Get all factories in a game
  async getGameFactories(gameId: string) {
    return this.prisma.factory.findMany({
      where: { gameId },
      include: {
        company: true,
        Sector: true,
        resources: true,
      },
    });
  }

  // Make factory operational
  async makeFactoryOperational(factoryId: string) {
    return this.prisma.factory.update({
      where: { id: factoryId },
      data: { isOperational: true },
    });
  }

  // Get total workers across all factories in a game
  async getTotalFactoryWorkers(gameId: string): Promise<number> {
    const result = await this.prisma.factory.aggregate({
      where: { gameId },
      _sum: { workers: true },
    });
    return result._sum.workers || 0;
  }
} 