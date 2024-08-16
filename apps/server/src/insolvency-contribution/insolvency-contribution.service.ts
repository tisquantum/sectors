import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, InsolvencyContribution } from '@prisma/client';
import { InsolvencyContributionWithRelations } from '@server/prisma/prisma.types';

@Injectable()
export class InsolvencyContributionService {
  constructor(private prisma: PrismaService) {}

  // Get a single insolvency contribution by unique identifier
  async getInsolvencyContribution(
    insolvencyContributionWhereUniqueInput: Prisma.InsolvencyContributionWhereUniqueInput,
  ): Promise<InsolvencyContribution | null> {
    return this.prisma.insolvencyContribution.findUnique({
      where: insolvencyContributionWhereUniqueInput,
    });
  }

  // List insolvency contributions with optional filters, pagination, and sorting
  async listInsolvencyContributions(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.InsolvencyContributionWhereUniqueInput;
    where?: Prisma.InsolvencyContributionWhereInput;
    orderBy?: Prisma.InsolvencyContributionOrderByWithRelationInput;
  }): Promise<InsolvencyContributionWithRelations[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.insolvencyContribution.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        Player: true,
        Company: true,
        GameTurn: true,
      },
    });
  }

  // Create a new insolvency contribution
  async createInsolvencyContribution(
    data: Prisma.InsolvencyContributionCreateInput,
  ): Promise<InsolvencyContribution> {
    // Ensure no duplicate contributions exist for the same player, company, and game turn
    const existingContribution =
      await this.prisma.insolvencyContribution.findFirst({
        where: {
          playerId: data.Player.connect?.id,
          companyId: data.Company.connect?.id,
          gameTurnId: data.GameTurn.connect?.id,
        },
      });

    if (existingContribution) {
      throw new Error(
        'Contribution already exists for this player, company, and game turn',
      );
    }

    return this.prisma.insolvencyContribution.create({
      data,
    });
  }

  // Create multiple insolvency contributions at once
  async createManyInsolvencyContributions(
    data: Prisma.InsolvencyContributionCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.insolvencyContribution.createMany({
      data,
      skipDuplicates: true,
    });
  }

  // Update an existing insolvency contribution
  async updateInsolvencyContribution(params: {
    where: Prisma.InsolvencyContributionWhereUniqueInput;
    data: Prisma.InsolvencyContributionUpdateInput;
  }): Promise<InsolvencyContribution> {
    const { where, data } = params;
    return this.prisma.insolvencyContribution.update({
      data,
      where,
    });
  }

  // Delete an insolvency contribution
  async deleteInsolvencyContribution(
    where: Prisma.InsolvencyContributionWhereUniqueInput,
  ): Promise<InsolvencyContribution> {
    return this.prisma.insolvencyContribution.delete({
      where,
    });
  }
}
