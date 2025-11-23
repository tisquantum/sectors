import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, Phase } from '@prisma/client';
import { TimerService } from '@server/timer/timer.service';
import { PhaseWithRelations } from '@server/prisma/prisma.types';

@Injectable()
export class PhaseService {
  constructor(private prisma: PrismaService) {}

  async phase(
    phaseWhereUniqueInput: Prisma.PhaseWhereUniqueInput,
  ): Promise<PhaseWithRelations | null> {
    return this.prisma.phase.findUnique({
      where: phaseWhereUniqueInput,
      include: {
        GameTurn: true,
        StockRound: true,
        OperatingRound: true,
        StockSubRound: true,
      },
    });
  }

  async phases(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PhaseWhereUniqueInput;
    where?: Prisma.PhaseWhereInput;
    orderBy?: Prisma.PhaseOrderByWithRelationInput;
  }): Promise<PhaseWithRelations[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.phase.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        GameTurn: true,
        StockRound: true,
        OperatingRound: true,
        StockSubRound: true,
      },
    });
  }

  async createPhase(data: Prisma.PhaseCreateInput): Promise<Phase> {
    return this.prisma.phase.create({
      data,
    });
  }

  async createManyPhases(
    data: Prisma.PhaseCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.phase.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async updatePhase(params: {
    where: Prisma.PhaseWhereUniqueInput;
    data: Prisma.PhaseUpdateInput;
  }): Promise<Phase> {
    const { where, data } = params;
    return this.prisma.phase.update({
      data,
      where,
    });
  }

  async deletePhase(where: Prisma.PhaseWhereUniqueInput): Promise<Phase> {
    return this.prisma.phase.delete({
      where,
    });
  }

  async currentPhase(gameId: string): Promise<Phase | null> {
    const currentPhase = await this.prisma.phase.findFirst({
      where: {
        gameId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return currentPhase;
  }
}
