import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FactorySize, Company, FactoryConstructionOrder, FactoryBlueprint, ResourceType, FactoryBlueprintType } from '@prisma/client';
import { ModernOperationMechanicsService } from '../game-management/modern-operation-mechanics.service';
import { PhaseService } from '@server/phase/phase.service';

interface RequiredResource {
  type: ResourceType;
  quantity: number;
}

@Injectable()
export class FactoryConstructionService {
  constructor(
    private prisma: PrismaService,
    private phaseService: PhaseService,
    private modernOperationMechanicsService: ModernOperationMechanicsService,
  ) {}

  async validateCompanyOwnership(companyId: string, playerId: string): Promise<boolean | null> {
    return true;
  }

  async createOrder(input: {
    companyId: string;
    gameId: string;
    size: FactorySize;
    resourceTypes: ResourceType[];
    playerId: string;
  }) {
    const { companyId, gameId, size, resourceTypes, playerId } = input;

    //get current phase
    const phase = await this.phaseService.currentPhase(gameId);

    if(!phase) {
      throw new Error('No phase found');
    }

    const order = await this.prisma.factoryConstructionOrder.create({
      data: {
        companyId,
        gameId,
        phaseId: phase.id,
        size,
        resourceTypes,
        playerId: playerId,
      },
    });
  }
} 