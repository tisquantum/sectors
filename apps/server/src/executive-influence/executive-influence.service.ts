import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import {
  Prisma,
  Influence,
  InfluenceBid,
  ExecutiveInfluenceBid,
  InfluenceLocation,
} from '@prisma/client';
import { RELATIONSHIP_TRACK_LENGTH } from '@server/data/executive_constants';

@Injectable()
export class ExecutiveInfluenceService {
  constructor(private prisma: PrismaService) {}

  // Retrieve a specific Influence by unique input
  async getInfluence(
    influenceWhereUniqueInput: Prisma.InfluenceWhereUniqueInput,
  ): Promise<Influence | null> {
    return this.prisma.influence.findUnique({
      where: influenceWhereUniqueInput,
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
    isBidLocked: boolean,
  ) {
    if (
      targetLocation != InfluenceLocation.OWNED_BY_PLAYER &&
      targetLocation != InfluenceLocation.RELATIONSHIP
    ) {
      throw new Error('Invalid target location');
    }

    let influenceBids = await this.prisma.influenceBid.findMany({
      where: {
        executiveInfluenceBidId: executiveInfluenceBid.id,
      },
    });

    if (isBidLocked) {
      const halfLength = Math.floor(influenceBids.length / 2);

      // Split the influence bids into two parts
      const selectedInfluenceBids = influenceBids.slice(0, halfLength);
      const remainingInfluenceBids = influenceBids.slice(halfLength);

      // Update the influence bids that are being moved back to the player
      await this.prisma.influence.updateMany({
        where: {
          id: {
            in: remainingInfluenceBids.map(
              (influenceBid) => influenceBid.influenceId,
            ),
          },
        },
        data: {
          ownedByPlayerId: executiveInfluenceBid.fromPlayerId,
          influenceLocation: InfluenceLocation.OF_PLAYER,
        },
      });

      // Update `influenceBids` to only include the selected bids
      influenceBids = selectedInfluenceBids;
    }

    //count all influence currently on relationship track
    const relationshipInfluenceCount = await this.prisma.influence.count({
      where: {
        ownedByPlayerId: executiveInfluenceBid.toPlayerId,
        influenceLocation: InfluenceLocation.RELATIONSHIP,
      },
    });
    const remainingRelationshipToFill =
      RELATIONSHIP_TRACK_LENGTH - relationshipInfluenceCount;
    if (
      targetLocation == InfluenceLocation.RELATIONSHIP &&
      influenceBids.length > remainingRelationshipToFill
    ) {
      //the remaining influence will be moved to OWNED_BY_PLAYER
      const remainingInfluenceBids = influenceBids.slice(
        remainingRelationshipToFill,
      );
      await this.prisma.influence.updateMany({
        where: {
          id: {
            in: remainingInfluenceBids.map(
              (influenceBid) => influenceBid.influenceId,
            ),
          },
        },
        data: {
          ownedByPlayerId: executiveInfluenceBid.toPlayerId,
          influenceLocation: InfluenceLocation.OWNED_BY_PLAYER,
        },
      });
      influenceBids = influenceBids.slice(0, remainingRelationshipToFill);
    }
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

    await this.moveInfluenceBackToOwningPlayers(
      executiveInfluenceBid.executiveGameTurnId,
      executiveInfluenceBid.toPlayerId,
    );
  }

  async moveInfluenceBackToOwningPlayers(
    executiveGameTurnId: string,
    toPlayerId: string,
  ) {
    //Get all other influence bids that have toPlayer, gameId and are not selected
    const otherBids = await this.prisma.executiveInfluenceBid.findMany({
      where: {
        executiveGameTurnId: executiveGameTurnId,
        toPlayerId: toPlayerId,
        isSelected: false,
      },
      include: {
        influenceBids: true,
      },
    });

    //move all their influence back to of_player
    const influencePromises = otherBids.map((bid) => {
      return this.prisma.influence.updateMany({
        where: {
          id: {
            in: bid.influenceBids.map(
              (influenceBid) => influenceBid.influenceId,
            ),
          },
        },
        data: {
          ownedByPlayerId: bid.fromPlayerId,
          influenceLocation: InfluenceLocation.OF_PLAYER,
        },
      });
    });
    return Promise.all(influencePromises);
  }
}
