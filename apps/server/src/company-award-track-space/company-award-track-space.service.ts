import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Adjust the path as needed
import {
  Prisma,
  CompanyAwardTrackSpace,
  CompanySpace,
  AwardTrackType,
} from '@prisma/client'; // Adjust the path as needed
import { AwardTrackSpaceWithRelations } from '@server/prisma/prisma.types';
import { isAtSpaceLimit } from '@server/data/helpers';

@Injectable()
export class CompanyAwardTrackSpaceService {
  constructor(private prisma: PrismaService) {}

  // Create a single CompanyAwardTrackSpace
  async createCompanyAwardTrackSpace(
    data: Prisma.CompanyAwardTrackSpaceCreateInput,
  ): Promise<CompanyAwardTrackSpace> {
    return this.prisma.companyAwardTrackSpace.create({
      data,
    });
  }

  // Create multiple CompanyAwardTrackSpaces and return them
  async createManyCompanyAwardTrackSpaces(
    data: Prisma.CompanyAwardTrackSpaceCreateManyInput[],
  ): Promise<CompanyAwardTrackSpace[]> {
    return this.prisma.companyAwardTrackSpace.createManyAndReturn({
      data,
    });
  }

  // Get a CompanyAwardTrackSpace by ID
  async getCompanyAwardTrackSpaceById(
    id: string,
  ): Promise<CompanyAwardTrackSpace | null> {
    return this.prisma.companyAwardTrackSpace.findUnique({
      where: { id },
    });
  }

  // Get all CompanyAwardTrackSpaces
  async getAllCompanyAwardTrackSpaces(): Promise<CompanyAwardTrackSpace[]> {
    return this.prisma.companyAwardTrackSpace.findMany();
  }

  // List CompanyAwardTrackSpaces with optional filtering, pagination, etc.
  async listCompanyAwardTrackSpaces(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CompanyAwardTrackSpaceWhereUniqueInput;
    where?: Prisma.CompanyAwardTrackSpaceWhereInput;
    orderBy?: Prisma.CompanyAwardTrackSpaceOrderByWithRelationInput;
  }): Promise<AwardTrackSpaceWithRelations[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.companyAwardTrackSpace.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
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
    });
  }

  // Update a CompanyAwardTrackSpace
  async updateCompanyAwardTrackSpace(
    id: string,
    data: Prisma.CompanyAwardTrackSpaceUpdateInput,
  ): Promise<CompanyAwardTrackSpace> {
    return this.prisma.companyAwardTrackSpace.update({
      where: { id },
      data,
    });
  }

  // Delete a CompanyAwardTrackSpace
  async deleteCompanyAwardTrackSpace(
    id: string,
  ): Promise<CompanyAwardTrackSpace> {
    return this.prisma.companyAwardTrackSpace.delete({
      where: { id },
    });
  }

  async createManyCompanyAwardTrackSpacesAndCompanySpaces(
    data: Prisma.CompanyAwardTrackSpaceCreateManyInput[],
  ): Promise<{
    spaces: CompanyAwardTrackSpace[];
    companySpaces: CompanySpace[];
  }> {
    const spaces = await this.prisma.companyAwardTrackSpace.createManyAndReturn(
      {
        data,
      },
    );
    const spaceZero = spaces.find((space) => space.awardTrackSpaceNumber === 0);
    if (!spaceZero) {
      throw new Error('CompanyAwardTrackSpace with spaceNumber 0 not found');
    }
    //get all companies currently in the game
    const companies = await this.prisma.company.findMany({
      where: {
        gameId: spaceZero.gameId,
      },
    });
    //create companyspaces
    const companySpaces = await this.prisma.companySpace.createManyAndReturn({
      data: companies.map((company) => ({
        companyId: company.id,
        companyAwardTrackSpaceId: spaceZero.id,
      })),
    });
    return { spaces, companySpaces };
  }

  async findSpaceForCompany(
    awardTrackId: string,
    companyId: string,
  ): Promise<CompanyAwardTrackSpace | null> {
    return this.prisma.companyAwardTrackSpace.findFirst({
      where: {
        awardTrackId,
        companySpaces: {
          some: {
            companyId,
          },
        },
      },
    });
  }

  async moveCompanyForwardOnSpace(
    companyId: string,
    awardTrackSpace: CompanyAwardTrackSpace,
    awardTrackType: AwardTrackType,
  ): Promise<CompanyAwardTrackSpace | null> {
    if (isAtSpaceLimit(awardTrackType, awardTrackSpace.awardTrackSpaceNumber)) {
      throw new Error('Cannot move company forward on space, reached limit');
    }
    const nextSpace = await this.prisma.companyAwardTrackSpace.findFirst({
      where: {
        awardTrackId: awardTrackSpace.awardTrackId,
        awardTrackSpaceNumber: awardTrackSpace.awardTrackSpaceNumber + 1,
      },
    });
    if (!nextSpace) {
      throw new Error('No next space found');
    }
    //remove previous company space
    await this.prisma.companySpace.deleteMany({
      where: {
        companyId,
        companyAwardTrackSpaceId: awardTrackSpace.id,
      },
    });
    //add company to next space
    await this.prisma.companySpace.create({
      data: {
        companyId,
        companyAwardTrackSpaceId: nextSpace.id,
      },
    });
    return nextSpace;
  }
}
