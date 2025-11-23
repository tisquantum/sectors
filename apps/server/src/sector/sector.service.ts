import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, Sector } from '@prisma/client';
import {
  SectorWithCompanies,
  SectorWithCompanyRelations,
} from '@server/prisma/prisma.types';

@Injectable()
export class SectorService {
  constructor(private prisma: PrismaService) {}

  async sector(
    sectorWhereUniqueInput: Prisma.SectorWhereUniqueInput,
  ): Promise<Sector | null> {
    return this.prisma.sector.findUnique({
      where: sectorWhereUniqueInput,
    });
  }

  async sectorWithCompanies(
    sectorWhereUniqueInput: Prisma.SectorWhereUniqueInput,
  ): Promise<SectorWithCompanies | null> {
    return this.prisma.sector.findUnique({
      where: sectorWhereUniqueInput,
      include: {
        Company: {
          include: {
            Share: {
              include: {
                Player: true,
              },
            },
            StockHistory: {
              include: {
                Phase: true,
              },
            },
            Sector: true,
            Cards: true,
            CompanyActions: true,
          },
        },
      },
    });
  }
  async sectors(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.SectorWhereUniqueInput;
    where?: Prisma.SectorWhereInput;
    orderBy?: Prisma.SectorOrderByWithRelationInput;
  }): Promise<Sector[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.sector.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async sectorsWithCompanies(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.SectorWhereUniqueInput;
    where?: Prisma.SectorWhereInput;
    orderBy?: Prisma.SectorOrderByWithRelationInput;
  }): Promise<SectorWithCompanyRelations[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.sector.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        Company: {
          include: {
            Share: {
              include: {
                Player: true,
              },
            },
            StockHistory: {
              include: {
                Phase: true,
              },
            },
            Sector: true,
            Cards: true,
            CompanyActions: true,
          },
        },
      },
    });
  }

  async createSector(data: Prisma.SectorCreateInput): Promise<Sector> {
    //remove id
    delete data.id;
    return this.prisma.sector.create({
      data,
    });
  }

  async createManySectors(
    data: Prisma.SectorCreateManyInput[],
  ): Promise<Sector[]> {
    //remove id
    data.forEach((d) => delete d.id);
    return this.prisma.sector.createManyAndReturn({
      data,
      skipDuplicates: true,
    });
  }

  async updateSector(params: {
    where: Prisma.SectorWhereUniqueInput;
    data: Prisma.SectorUpdateInput;
  }): Promise<Sector> {
    const { where, data } = params;
    return this.prisma.sector.update({
      data,
      where,
    });
  }
  async updateMany(
    updates: { id: string; consumers: number }[],
  ): Promise<void> {
    const updatePromises = updates.map((update) =>
      this.prisma.sector.update({
        where: { id: update.id },
        data: { consumers: update.consumers },
      }),
    );

    // Execute all updates in parallel
    await Promise.all(updatePromises);
  }

  async deleteSector(where: Prisma.SectorWhereUniqueInput): Promise<Sector> {
    return this.prisma.sector.delete({
      where,
    });
  }

  async updateResearchMarker(
    sectorId: string,
    gameId: string,
    amount: number,
  ): Promise<Sector> {
    // First verify the sector belongs to the game
    const sector = await this.prisma.sector.findFirst({
      where: {
        id: sectorId,
        gameId,
      },
    });

    if (!sector) {
      throw new Error('Sector not found or does not belong to the specified game');
    }

    // Update the research marker
    return this.prisma.sector.update({
      where: { id: sectorId },
      data: {
        researchMarker: {
          increment: amount,
        },
      },
    });
  }

  async getSectorResearchProgress(
    sectorId: string,
    gameId: string,
  ): Promise<{ researchMarker: number; companies: { id: string; researchProgress: number }[] }> {
    // Get the sector with its companies
    const sector = await this.prisma.sector.findFirst({
      where: {
        id: sectorId,
        gameId,
      },
      include: {
        Company: {
          select: {
            id: true,
            researchProgress: true,
          },
        },
      },
    });

    if (!sector) {
      throw new Error('Sector not found or does not belong to the specified game');
    }

    return {
      researchMarker: sector.researchMarker,
      companies: sector.Company.map(company => ({
        id: company.id,
        researchProgress: company.researchProgress,
      })),
    };
  }
}
