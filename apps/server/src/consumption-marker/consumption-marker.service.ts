import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, ConsumptionMarker, ResourceType } from '@prisma/client';

@Injectable()
export class ConsumptionMarkerService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async consumptionMarker(
    consumptionMarkerWhereUniqueInput: Prisma.ConsumptionMarkerWhereUniqueInput,
  ): Promise<ConsumptionMarker | null> {
    return this.prisma.consumptionMarker.findUnique({
      where: consumptionMarkerWhereUniqueInput,
    });
  }

  async consumptionMarkers(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ConsumptionMarkerWhereUniqueInput;
    where?: Prisma.ConsumptionMarkerWhereInput;
    orderBy?: Prisma.ConsumptionMarkerOrderByWithRelationInput;
  }): Promise<ConsumptionMarker[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.consumptionMarker.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async consumptionMarkersBySector(sectorId: string, gameId: string): Promise<ConsumptionMarker[]> {
    return this.prisma.consumptionMarker.findMany({
      where: { sectorId, gameId },
      include: {
        Company: true,
      },
    });
  }

  async createConsumptionMarker(
    data: Prisma.ConsumptionMarkerCreateInput,
  ): Promise<ConsumptionMarker> {
    return this.prisma.consumptionMarker.create({
      data,
    });
  }

  async createManyConsumptionMarkers(
    data: Prisma.ConsumptionMarkerCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.consumptionMarker.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async deleteConsumptionMarker(
    where: Prisma.ConsumptionMarkerWhereUniqueInput,
  ): Promise<ConsumptionMarker> {
    return this.prisma.consumptionMarker.delete({
      where,
    });
  }

  async deleteManyConsumptionMarkers(
    where: Prisma.ConsumptionMarkerWhereInput,
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.consumptionMarker.deleteMany({
      where,
    });
  }

  async countConsumptionMarkers(
    where?: Prisma.ConsumptionMarkerWhereInput,
  ): Promise<number> {
    return this.prisma.consumptionMarker.count({
      where,
    });
  }

  /**
   * Initialize consumption bag for a sector with 5 permanent sector-specific markers
   */
  async initializeSectorConsumptionBag(
    gameId: string,
    sectorId: string,
    resourceType: ResourceType,
  ): Promise<Prisma.BatchPayload> {
    const markers: Prisma.ConsumptionMarkerCreateManyInput[] = [];
    
    for (let i = 0; i < 5; i++) {
      markers.push({
        gameId,
        sectorId,
        resourceType,
        isPermanent: true,
        companyId: null,
      });
    }

    return this.createManyConsumptionMarkers(markers);
  }

  /**
   * Add a permanent factory marker when a factory is built
   */
  async addFactoryMarkerToBag(
    gameId: string,
    sectorId: string,
    companyId: string,
    resourceType: ResourceType,
  ): Promise<ConsumptionMarker> {
    return this.createConsumptionMarker({
      Game: { connect: { id: gameId } },
      Sector: { connect: { id: sectorId } },
      Company: { connect: { id: companyId } },
      resourceType,
      isPermanent: true,
    });
  }

  /**
   * Add temporary marketing markers to the bag
   */
  async addMarketingMarkersToBag(
    gameId: string,
    sectorId: string,
    companyId: string,
    resourceType: ResourceType,
    count: number,
  ): Promise<Prisma.BatchPayload> {
    const markers: Prisma.ConsumptionMarkerCreateManyInput[] = [];
    
    for (let i = 0; i < count; i++) {
      markers.push({
        gameId,
        sectorId,
        companyId,
        resourceType,
        isPermanent: false,
      });
    }

    return this.createManyConsumptionMarkers(markers);
  }

  /**
   * Draw a random marker from the sector's consumption bag
   */
  async drawMarkerFromBag(sectorId: string, gameId: string): Promise<ConsumptionMarker | null> {
    const markers = await this.consumptionMarkersBySector(sectorId, gameId);
    
    if (markers.length === 0) {
      return null;
    }

    // Randomly select a marker
    const randomIndex = Math.floor(Math.random() * markers.length);
    return markers[randomIndex];
  }

  /**
   * Remove temporary markers after they're drawn
   */
  async removeTemporaryMarker(markerId: string): Promise<ConsumptionMarker> {
    return this.deleteConsumptionMarker({ id: markerId });
  }

  /**
   * Get all consumption markers for a sector (the consumption bag)
   */
  async getSectorConsumptionBag(sectorId: string, gameId: string): Promise<ConsumptionMarker[]> {
    return this.consumptionMarkersBySector(sectorId, gameId);
  }

  /**
   * Get all consumption bags for all sectors in a game
   */
  async getAllConsumptionBags(gameId: string): Promise<ConsumptionMarker[]> {
    return this.consumptionMarkers({
      where: { gameId },
    });
  }
}

