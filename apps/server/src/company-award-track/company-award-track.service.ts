import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Adjust the path as needed
import { Prisma, CompanyAwardTrack, AwardTrackType } from '@prisma/client'; // Adjust the path as needed
import { CompanyAwardTrackSpaceService } from '@server/company-award-track-space/company-award-track-space.service';
import { getSpacesForAwardTrackType } from '@server/data/helpers';
import { AwardTrackWithRelations } from '@server/prisma/prisma.types';

@Injectable()
export class CompanyAwardTrackService {
  constructor(
    private prisma: PrismaService,
    private companyAwardTrackSpaceService: CompanyAwardTrackSpaceService,
  ) {}

  // Create a single CompanyAwardTrack
  async createCompanyAwardTrack(
    data: Prisma.CompanyAwardTrackCreateInput,
  ): Promise<CompanyAwardTrack> {
    return this.prisma.companyAwardTrack.create({
      data,
    });
  }

  // Create multiple CompanyAwardTracks and return them
  async createManyCompanyAwardTracks(
    data: Prisma.CompanyAwardTrackCreateManyInput[],
  ): Promise<CompanyAwardTrack[]> {
    return this.prisma.companyAwardTrack.createManyAndReturn({
      data,
    });
  }

  // Get a CompanyAwardTrack by ID
  async getCompanyAwardTrackById(
    id: string,
  ): Promise<CompanyAwardTrack | null> {
    return this.prisma.companyAwardTrack.findUnique({
      where: { id },
    });
  }

  // Get all CompanyAwardTracks
  async getAllCompanyAwardTracks(): Promise<CompanyAwardTrack[]> {
    return this.prisma.companyAwardTrack.findMany();
  }

  // List CompanyAwardTracks with optional filtering, pagination, etc.
  async listCompanyAwardTracks(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CompanyAwardTrackWhereUniqueInput;
    where?: Prisma.CompanyAwardTrackWhereInput;
    orderBy?: Prisma.CompanyAwardTrackOrderByWithRelationInput;
  }): Promise<CompanyAwardTrack[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.companyAwardTrack.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async listCompanyAwardTracksWithRelations(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CompanyAwardTrackWhereUniqueInput;
    where?: Prisma.CompanyAwardTrackWhereInput;
    orderBy?: Prisma.CompanyAwardTrackOrderByWithRelationInput;
  }): Promise<AwardTrackWithRelations[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.companyAwardTrack.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        companyAwardTrackSpaces: {
          include: {
            companySpaces: {
              include: {
                Company: {
                  include: {
                    Sector: true,
                  },
                }
              },
            },
          },
        },
      },
    });
  }

  // Update a CompanyAwardTrack
  async updateCompanyAwardTrack(
    id: string,
    data: Prisma.CompanyAwardTrackUpdateInput,
  ): Promise<CompanyAwardTrack> {
    return this.prisma.companyAwardTrack.update({
      where: { id },
      data,
    });
  }

  // Delete a CompanyAwardTrack
  async deleteCompanyAwardTrack(id: string): Promise<CompanyAwardTrack> {
    return this.prisma.companyAwardTrack.delete({
      where: { id },
    });
  }

  async createAwardTrackAndSpaces(
    gameId: string,
    awardTrackName: string,
    awardTrackType: AwardTrackType,
  ) {
    const awardTrack = await this.createCompanyAwardTrack({
      awardTrackName,
      awardTrackType,
      Game: { connect: { id: gameId } },
    });

    const awardTrackSpaces = getSpacesForAwardTrackType(awardTrackType);
    //create that many spaces including 0 and put every company that is in the game on zero
    const spaces = Array.from({ length: awardTrackSpaces }).map((_, index) => ({
      awardTrackId: awardTrack.id,
      gameId,
      awardTrackSpaceNumber: index,
    }));
    await this.companyAwardTrackSpaceService.createManyCompanyAwardTrackSpacesAndCompanySpaces(
      spaces,
    );
  }
}
