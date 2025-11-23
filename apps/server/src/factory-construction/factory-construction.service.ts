import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FactorySize, Company, FactoryConstructionOrder, ResourceType } from '@prisma/client';
import { ModernOperationMechanicsService } from '../game-management/modern-operation-mechanics.service';
import { PhaseService } from '@server/phase/phase.service';
import { PlayersService } from '@server/players/players.service';
import { CompanyService } from '@server/company/company.service';

interface RequiredResource {
  type: ResourceType;
  quantity: number;
}

@Injectable()
export class FactoryConstructionService {
  constructor(
    private prisma: PrismaService,
    private phaseService: PhaseService,
    private companyService: CompanyService,
  ) {}

  async validateCompanyOwnership(companyId: string, playerId: string): Promise<boolean | null> {
    //check if company owner player id is the same as the player id
    const company = await this.companyService.company({ id: companyId });
    if(!company) {
      return null;
    }
    return company.ceoId === playerId;
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

    // Get company to find sectorId
    const company = await this.companyService.company({ id: companyId });
    if (!company) {
      throw new Error('Company not found');
    }
    if (!company.sectorId) {
      throw new Error('Company has no sector');
    }

    const order = await this.prisma.factoryConstructionOrder.create({
      data: {
        companyId,
        gameId,
        gameTurnId: phase.gameTurnId,
        phaseId: phase.id,
        sectorId: company.sectorId,
        size,
        resourceTypes,
        playerId: playerId,
      },
    });

    return order;
  }
} 