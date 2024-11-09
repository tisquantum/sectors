import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import {
  Prisma,
  ExecutiveInfluenceBid,
  Influence,
  InfluenceLocation,
} from '@prisma/client';
import { ExecutiveInfluenceBidWithRelations } from '@server/prisma/prisma.types';

@Injectable()
export class ExecutiveInfluenceBidService {
  constructor(private prisma: PrismaService) {}

  // Retrieve a specific ExecutiveInfluenceBid by unique input
  async getExecutiveInfluenceBid(
    executiveInfluenceBidWhereUniqueInput: Prisma.ExecutiveInfluenceBidWhereUniqueInput,
  ): Promise<ExecutiveInfluenceBid | null> {
    return this.prisma.executiveInfluenceBid.findUnique({
      where: executiveInfluenceBidWhereUniqueInput,
      include: {
        game: true,
        player: true,
        ExecutiveGameTurn: true,
        influenceBids: true,
      },
    });
  }

  // List all ExecutiveInfluenceBids with optional filtering, pagination, and sorting
  async listExecutiveInfluenceBids(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ExecutiveInfluenceBidWhereUniqueInput;
    where?: Prisma.ExecutiveInfluenceBidWhereInput;
    orderBy?: Prisma.ExecutiveInfluenceBidOrderByWithRelationInput;
  }): Promise<ExecutiveInfluenceBidWithRelations[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.executiveInfluenceBid.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        player: true,
        ExecutiveGameTurn: true,
        influenceBids: {
          include: {
            Influence: true,
          },
        },
      },
    });
  }

  // Create a new ExecutiveInfluenceBid
  async createExecutiveInfluenceBid(
    data: Prisma.ExecutiveInfluenceBidCreateInput,
    influence: Influence[],
  ): Promise<ExecutiveInfluenceBid> {
    const executiveInfluenceBid =
      await this.prisma.executiveInfluenceBid.create({
        data,
      });

    //create influence bids
    await this.prisma.influenceBid.createMany({
      data: influence.map((influence) => ({
        influenceId: influence.id,
        executiveInfluenceBidId: executiveInfluenceBid.id,
      })),
    });

    //update all influence to location BRIBE
    await this.prisma.influence.updateMany({
      where: {
        id: {
          in: influence.map((influence) => influence.id),
        },
      },
      data: {
        ownedByPlayerId: null,
        influenceLocation: InfluenceLocation.BRIBE,
      },
    });

    return executiveInfluenceBid;
  }

  // Update an existing ExecutiveInfluenceBid
  async updateExecutiveInfluenceBid(params: {
    where: Prisma.ExecutiveInfluenceBidWhereUniqueInput;
    data: Prisma.ExecutiveInfluenceBidUpdateInput;
  }): Promise<ExecutiveInfluenceBid> {
    const { where, data } = params;
    return this.prisma.executiveInfluenceBid.update({
      data,
      where,
    });
  }

  // Delete an ExecutiveInfluenceBid
  async deleteExecutiveInfluenceBid(
    where: Prisma.ExecutiveInfluenceBidWhereUniqueInput,
  ): Promise<ExecutiveInfluenceBid> {
    return this.prisma.executiveInfluenceBid.delete({
      where,
    });
  }
}
