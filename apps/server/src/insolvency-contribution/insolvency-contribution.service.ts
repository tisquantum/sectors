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
  ): Promise<InsolvencyContributionWithRelations> {
    // Ensure no duplicate contributions exist for the same player, company, and game turn
    const existingContribution =
      await this.prisma.insolvencyContribution.findFirst({
        where: {
          playerId: data.Player.connect?.id,
          companyId: data.Company.connect?.id,
          gameTurnId: data.GameTurn.connect?.id,
        },
        include: {
          Player: true,
          Company: true,
          GameTurn: true,
        },
      });

    if (existingContribution?.cashContribution && data.cashContribution > 0) {
      throw new Error(
        'Cash contribution already exists for this player, company, and game turn',
      );
    }
    if (existingContribution?.shareContribution && data.shareContribution > 0) {
      throw new Error(
        'Share contribution already exists for this player, company, and game turn',
      );
    }
    //get player with shares
    const playerWithShares = await this.prisma.player.findUnique({
      where: {
        id: data.Player.connect?.id,
      },
      include: {
        Share: true,
      },
    });
    //if no player
    if (!playerWithShares) {
      throw new Error('Player not found');
    }
    if(data.shareContribution) {
      //if player doesn't have enough shares, throw error
      if (playerWithShares.Share.length < data.shareContribution) {
        throw new Error('Player does not have enough shares');
      }
    }
    if(data.cashContribution) {
      //if player doesn't have enough cash, throw error
      if (playerWithShares.cashOnHand < data.cashContribution) {
        throw new Error('Player does not have enough cash');
      }
    }
    return this.prisma.insolvencyContribution.create({
      data,
      include: {
        Player: true,
        Company: true,
        GameTurn: true,
      },
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
