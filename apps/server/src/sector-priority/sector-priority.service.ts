import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, SectorPriority } from '@prisma/client';

@Injectable()
export class SectorPriorityService {
  constructor(private prisma: PrismaService) {}

  // Retrieve a specific SectorPriority by unique input
  async getSectorPriority(
    sectorPriorityWhereUniqueInput: Prisma.SectorPriorityWhereUniqueInput,
  ): Promise<SectorPriority | null> {
    return this.prisma.sectorPriority.findUnique({
      where: sectorPriorityWhereUniqueInput,
      include: {
        Game: true,
        Sector: true,
      },
    });
  }

  // List all SectorPriorities with optional filtering, pagination, and sorting
  async listSectorPriorities(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.SectorPriorityWhereUniqueInput;
    where?: Prisma.SectorPriorityWhereInput;
    orderBy?: Prisma.SectorPriorityOrderByWithRelationInput;
  }): Promise<SectorPriority[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.sectorPriority.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  // Create a new SectorPriority
  async createSectorPriority(
    data: Prisma.SectorPriorityCreateInput,
  ): Promise<SectorPriority> {
    return this.prisma.sectorPriority.create({
      data,
    });
  }

  // Create multiple SectorPriorities
  async createManySectorPriorities(
    data: Prisma.SectorPriorityCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.sectorPriority.createMany({
      data,
      skipDuplicates: true,
    });
  }

  // Update an existing SectorPriority
  async updateSectorPriority(params: {
    where: Prisma.SectorPriorityWhereUniqueInput;
    data: Prisma.SectorPriorityUpdateInput;
  }): Promise<SectorPriority> {
    const { where, data } = params;
    return this.prisma.sectorPriority.update({
      data,
      where,
    });
  }

  // Delete a SectorPriority
  async deleteSectorPriority(
    where: Prisma.SectorPriorityWhereUniqueInput,
  ): Promise<SectorPriority> {
    return this.prisma.sectorPriority.delete({
      where,
    });
  }
}
