import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, ExecutivePhase, ExecutivePhaseName } from '@prisma/client';

@Injectable()
export class ExecutivePhaseService {
  constructor(private prisma: PrismaService) {}

  // Retrieve a specific ExecutivePhase by unique input
  async getExecutivePhase(
    executivePhaseWhereUniqueInput: Prisma.ExecutivePhaseWhereUniqueInput,
  ): Promise<ExecutivePhase | null> {
    return this.prisma.executivePhase.findUnique({
      where: executivePhaseWhereUniqueInput,
    });
  }

  // List all ExecutivePhases with optional filtering, pagination, and sorting
  async listExecutivePhases(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ExecutivePhaseWhereUniqueInput;
    where?: Prisma.ExecutivePhaseWhereInput;
    orderBy?: Prisma.ExecutivePhaseOrderByWithRelationInput;
  }): Promise<ExecutivePhase[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.executivePhase.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  // Create a new ExecutivePhase
  async createExecutivePhase(
    data: Prisma.ExecutivePhaseCreateInput,
  ): Promise<ExecutivePhase> {
    return this.prisma.executivePhase.create({
      data,
    });
  }

  // Update an existing ExecutivePhase
  async updateExecutivePhase(params: {
    where: Prisma.ExecutivePhaseWhereUniqueInput;
    data: Prisma.ExecutivePhaseUpdateInput;
  }): Promise<ExecutivePhase> {
    const { where, data } = params;
    return this.prisma.executivePhase.update({
      where,
      data,
    });
  }

  // Delete an ExecutivePhase
  async deleteExecutivePhase(
    where: Prisma.ExecutivePhaseWhereUniqueInput,
  ): Promise<ExecutivePhase> {
    return this.prisma.executivePhase.delete({
      where,
    });
  }

  // Retrieve the current phase for a specific game
  async getCurrentPhase(gameId: string): Promise<ExecutivePhase | null> {
    return this.prisma.executivePhase.findFirst({
      where: {
        gameId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getPreviousPhase({
    gameId,
    gameTurnId,
    phaseName,
  }: {
    gameId: string;
    gameTurnId?: string;
    phaseName?: ExecutivePhaseName;
  }): Promise<ExecutivePhase | null> {
    return this.prisma.executivePhase.findFirst({
      where: {
        gameId,
        gameTurnId: gameTurnId ? gameTurnId : undefined,
        phaseName: phaseName ? phaseName : undefined,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: 1,
    });
  }
}
