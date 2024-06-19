import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, Phase } from '@prisma/client';

@Injectable()
export class PhaseService {
  constructor(private prisma: PrismaService) {}

  async phase(
    phaseWhereUniqueInput: Prisma.PhaseWhereUniqueInput,
  ): Promise<Phase | null> {
    return this.prisma.phase.findUnique({
      where: phaseWhereUniqueInput,
    });
  }

  async phases(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PhaseWhereUniqueInput;
    where?: Prisma.PhaseWhereInput;
    orderBy?: Prisma.PhaseOrderByWithRelationInput;
  }): Promise<Phase[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.phase.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createPhase(data: Prisma.PhaseCreateInput): Promise<Phase> {
    return this.prisma.phase.create({
      data,
    });
  }

  async createManyPhases(data: Prisma.PhaseCreateManyInput[]): Promise<Prisma.BatchPayload> {
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
}
