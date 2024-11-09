import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import {
  Prisma,
  Influence,
  InfluenceBid,
  ExecutiveInfluenceBid,
  InfluenceLocation,
} from '@prisma/client';

@Injectable()
export class ExecutiveInfluenceService {
  constructor(private prisma: PrismaService) {}

  // Retrieve a specific Influence by unique input
  async getInfluence(
    influenceWhereUniqueInput: Prisma.InfluenceWhereUniqueInput,
  ): Promise<Influence | null> {
    return this.prisma.influence.findUnique({
      where: influenceWhereUniqueInput,
      include: {
        Game: true,
        selfPlayer: true,
        ownedByPlayer: true,
        ExecutiveInfluenceVote: true,
        influenceBids: true,
      },
    });
  }

  // List all Influences with optional filtering, pagination, and sorting
  async listInfluences(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.InfluenceWhereUniqueInput;
    where?: Prisma.InfluenceWhereInput;
    orderBy?: Prisma.InfluenceOrderByWithRelationInput;
  }): Promise<Influence[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.influence.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        Game: true,
        selfPlayer: true,
        ownedByPlayer: true,
        ExecutiveInfluenceVote: true,
        influenceBids: true,
      },
    });
  }

  // Create a new Influence
  async createInfluence(data: Prisma.InfluenceCreateInput): Promise<Influence> {
    return this.prisma.influence.create({
      data,
    });
  }

  async createManyInfluence(
    data: Prisma.InfluenceCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.influence.createMany({
      data,
      skipDuplicates: true,
    });
  }

  // Update an existing Influence
  async updateInfluence(params: {
    where: Prisma.InfluenceWhereUniqueInput;
    data: Prisma.InfluenceUpdateInput;
  }): Promise<Influence> {
    const { where, data } = params;
    return this.prisma.influence.update({
      data,
      where,
    });
  }

  // Delete an Influence
  async deleteInfluence(
    where: Prisma.InfluenceWhereUniqueInput,
  ): Promise<Influence> {
    return this.prisma.influence.delete({
      where,
    });
  }

  async moveInfluenceBidToPlayer(
    executiveInfluenceBid: ExecutiveInfluenceBid,
    targetLocation: InfluenceLocation,
  ) {
    if (
      targetLocation != InfluenceLocation.OWNED_BY_PLAYER &&
      targetLocation != InfluenceLocation.RELATIONSHIP
    ) {
      throw new Error('Invalid target location');
    }

    const influenceBids = await this.prisma.influenceBid.findMany({
      where: {
        executiveInfluenceBidId: executiveInfluenceBid.id,
      },
    });

    //update all influence with new player owner
    await this.prisma.influence.updateMany({
      where: {
        id: {
          in: influenceBids.map((influenceBid) => influenceBid.influenceId),
        },
      },
      data: {
        ownedByPlayerId: executiveInfluenceBid.toPlayerId,
        influenceLocation: targetLocation,
      },
    });

    //update this bid as isSelected
    await this.prisma.executiveInfluenceBid.update({
      where: {
        id: executiveInfluenceBid.id,
      },
      data: {
        isSelected: true,
      },
    });

    //Get all other influence bids that have toPlayer, gameId and are not selected
    const otherBids = await this.prisma.executiveInfluenceBid.findMany({
      where: {
        executiveGameTurnId: executiveInfluenceBid.executiveGameTurnId,
        toPlayerId: executiveInfluenceBid.toPlayerId,
        isSelected: false,
      },
    });

    //move all their influence back to of_player
    const influencePromises = otherBids.map((bid) => {
      return this.prisma.influence.updateMany({
        where: {
          id: {
            in: influenceBids.map((influenceBid) => influenceBid.influenceId),
          },
        },
        data: {
          ownedByPlayerId: bid.fromPlayerId,
          influenceLocation: InfluenceLocation.OF_PLAYER,
        },
      });
    });
    Promise.all(influencePromises);
  }
}
