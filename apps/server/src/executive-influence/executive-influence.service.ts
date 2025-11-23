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

export interface InfluenceMove {
  targetLocation: InfluenceLocation;
  influenceIds: string[];
}

@Injectable()
export class ExecutiveInfluenceService {
  private influenceCache = new Map<string, Influence>(); // Cache with influenceId as key

  constructor(private prisma: PrismaService) {}

  // Retrieve a specific Influence by unique input
  async getInfluence(
    influenceWhereUniqueInput: Prisma.InfluenceWhereUniqueInput,
  ): Promise<Influence | null> {
    const influenceId = influenceWhereUniqueInput.id;

    if (!influenceId) {
      return null;
    }

    // Check the cache
    if (this.influenceCache.has(influenceId)) {
      return this.influenceCache.get(influenceId) || null;
    }

    // Fallback to database and cache the result
    const influence = await this.prisma.influence.findUnique({
      where: influenceWhereUniqueInput,
    });

    if (influence) {
      this.influenceCache.set(influenceId, influence);
    }

    return influence;
  }

  // List all Influences
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
    const influence = await this.prisma.influence.create({
      data,
    });

    // Cache the newly created influence
    if (influence.id) {
      this.influenceCache.set(influence.id, influence);
    }

    return influence;
  }

  // Update an existing Influence
  async updateInfluence(params: {
    where: Prisma.InfluenceWhereUniqueInput;
    data: Prisma.InfluenceUpdateInput;
  }): Promise<Influence> {
    const { where, data } = params;
    const influenceId = where.id;

    if (!influenceId) {
      throw new Error('Invalid influence ID');
    }

    const updatedInfluence = await this.prisma.influence.update({
      where,
      data,
    });

    // Update the cache
    this.influenceCache.set(influenceId, updatedInfluence);

    return updatedInfluence;
  }

  // Delete an Influence
  async deleteInfluence(
    where: Prisma.InfluenceWhereUniqueInput,
  ): Promise<Influence> {
    const influenceId = where.id;

    if (!influenceId) {
      throw new Error('Invalid influence ID');
    }

    const deletedInfluence = await this.prisma.influence.delete({
      where,
    });

    // Remove from the cache
    this.influenceCache.delete(influenceId);

    return deletedInfluence;
  }

  async moveInfluenceBidToPlayerLegacy(
    executiveInfluenceBid: ExecutiveInfluenceBid,
    targetLocation: InfluenceLocation,
    isBidLocked: boolean,
  ) {
    if (
      targetLocation !== InfluenceLocation.OWNED_BY_PLAYER &&
      targetLocation !== InfluenceLocation.RELATIONSHIP
    ) {
      throw new Error('Invalid target location');
    }

    // Get influence bids, checking cache first
    let influenceBids = await this.prisma.influenceBid.findMany({
      where: {
        executiveInfluenceBidId: executiveInfluenceBid.id,
      },
    });

    const getInfluenceFromCache = (influenceId: string) => {
      if (this.influenceCache.has(influenceId)) {
        return this.influenceCache.get(influenceId);
      }
      return null;
    };

    const updateInfluenceInCache = (
      influenceId: string,
      updates: Partial<Influence>,
    ) => {
      const cachedInfluence = this.influenceCache.get(influenceId);
      if (cachedInfluence) {
        this.influenceCache.set(influenceId, {
          ...cachedInfluence,
          ...updates,
        });
      }
    };

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

      // Update cache for remaining bids
      remainingInfluenceBids.forEach((bid) => {
        updateInfluenceInCache(bid.influenceId, {
          ownedByPlayerId: executiveInfluenceBid.fromPlayerId,
          influenceLocation: InfluenceLocation.OF_PLAYER,
        });
      });

      // Update influenceBids to only include the selected bids
      influenceBids = selectedInfluenceBids;
    }

    // Count all influence currently on the relationship track
    const relationshipInfluenceCount = await this.prisma.influence.count({
      where: {
        ownedByPlayerId: executiveInfluenceBid.toPlayerId,
        influenceLocation: InfluenceLocation.RELATIONSHIP,
      },
    });
    const remainingRelationshipToFill =
      RELATIONSHIP_TRACK_LENGTH - relationshipInfluenceCount;

    if (
      targetLocation === InfluenceLocation.RELATIONSHIP &&
      influenceBids.length > remainingRelationshipToFill
    ) {
      // The remaining influence will be moved to OWNED_BY_PLAYER
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

      // Update cache for remaining bids
      remainingInfluenceBids.forEach((bid) => {
        updateInfluenceInCache(bid.influenceId, {
          ownedByPlayerId: executiveInfluenceBid.toPlayerId,
          influenceLocation: InfluenceLocation.OWNED_BY_PLAYER,
        });
      });

      influenceBids = influenceBids.slice(0, remainingRelationshipToFill);
    }

    // Update all influence with the new player owner
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

    // Update cache for moved bids
    influenceBids.forEach((bid) => {
      updateInfluenceInCache(bid.influenceId, {
        ownedByPlayerId: executiveInfluenceBid.toPlayerId,
        influenceLocation: targetLocation,
      });
    });

    // Mark the bid as selected
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

  async moveInfluenceBidToPlayer(
    executiveInfluenceBid: ExecutiveInfluenceBid,
    influenceMoves: InfluenceMove[],
  ) {
    //iterate over influenceMoves and create a promise
    const promises = influenceMoves.map((move) => {
      return this.moveInfluenceBidToPlayerSingle({
        executiveInfluenceBid: executiveInfluenceBid,
        targetLocation: move.targetLocation,
        influenceIds: move.influenceIds,
      });
    });
    //wait for all promises to resolve
    await Promise.all(promises);
  }

  async moveInfluenceBidToPlayerSingle({
    executiveInfluenceBid,
    targetLocation,
    influenceIds,
  }: {
    executiveInfluenceBid: ExecutiveInfluenceBid;
    targetLocation: InfluenceLocation;
    influenceIds: string[];
  }) {
    if (
      targetLocation !== InfluenceLocation.OWNED_BY_PLAYER &&
      targetLocation !== InfluenceLocation.RELATIONSHIP
    ) {
      throw new Error('Invalid target location');
    }

    // Get influence bids, checking cache first
    let influenceBids = await this.prisma.influenceBid.findMany({
      where: {
        executiveInfluenceBidId: executiveInfluenceBid.id,
        influenceId: {
          in: influenceIds,
        },
      },
      include: {
        Influence: true,
      },
    });

    //all influence bids must be from the same player
    if (
      !influenceBids.every(
        (bid) =>
          bid.Influence.ownedByPlayerId ===
          influenceBids?.[0]?.Influence?.ownedByPlayerId,
      )
    ) {
      throw new Error('Influence bids must be from the same player');
    }

    const updateInfluenceInCache = (
      influenceId: string,
      updates: Partial<Influence>,
    ) => {
      const cachedInfluence = this.influenceCache.get(influenceId);
      if (cachedInfluence) {
        this.influenceCache.set(influenceId, {
          ...cachedInfluence,
          ...updates,
        });
      }
    };

    // Count all influence currently on the relationship track
    const relationshipInfluenceCount = await this.prisma.influence.count({
      where: {
        ownedByPlayerId: executiveInfluenceBid.toPlayerId,
        influenceLocation: InfluenceLocation.RELATIONSHIP,
        selfPlayerId: influenceBids?.[0]?.Influence?.selfPlayerId,
      },
    });
    const remainingRelationshipToFill =
      RELATIONSHIP_TRACK_LENGTH - relationshipInfluenceCount;

    if (
      targetLocation === InfluenceLocation.RELATIONSHIP &&
      influenceBids.length > remainingRelationshipToFill
    ) {
      // The remaining influence will be moved to OWNED_BY_PLAYER
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

      // Update cache for remaining bids
      remainingInfluenceBids.forEach((bid) => {
        updateInfluenceInCache(bid.influenceId, {
          ownedByPlayerId: executiveInfluenceBid.toPlayerId,
          influenceLocation: InfluenceLocation.OWNED_BY_PLAYER,
        });
      });

      influenceBids = influenceBids.slice(0, remainingRelationshipToFill);
    }

    // Update all influence with the new player owner
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

    // Update cache for moved bids
    influenceBids.forEach((bid) => {
      updateInfluenceInCache(bid.influenceId, {
        ownedByPlayerId: executiveInfluenceBid.toPlayerId,
        influenceLocation: targetLocation,
      });
    });

    // Mark the bid as selected
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
    // Get all other influence bids that have toPlayer, gameId, and are not selected
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

    // Move all their influence back to OF_PLAYER
    const influencePromises = otherBids.map((bid) => {
      const influenceIds = bid.influenceBids.map(
        (influenceBid) => influenceBid.influenceId,
      );

      // Update cache for each influence
      influenceIds.forEach((influenceId) => {
        if (this.influenceCache.has(influenceId)) {
          const cachedInfluence = this.influenceCache.get(influenceId);
          if (cachedInfluence) {
            this.influenceCache.set(influenceId, {
              ...cachedInfluence,
              ownedByPlayerId: bid.fromPlayerId,
              influenceLocation: InfluenceLocation.OF_PLAYER,
            });
          }
        }
      });

      return this.prisma.influence.updateMany({
        where: {
          id: {
            in: influenceIds,
          },
        },
        data: {
          //ownedByPlayerId: bid.fromPlayerId, TODO: This shouldn't be necessary anymore as we don't update ownedByPlayer to null when an influence bid is created
          influenceLocation: InfluenceLocation.OF_PLAYER,
        },
      });
    });

    return Promise.all(influencePromises);
  }

  // Create multiple Influence records
  // Create multiple Influence records
  async createManyInfluence(
    data: Prisma.InfluenceCreateManyInput[],
  ): Promise<Influence[]> {
    // Use Prisma to create the records in the database
    await this.prisma.influence.createMany({
      data,
      skipDuplicates: true,
    });

    // Filter out undefined `id` values
    const influenceIds = data
      .map((influence) => influence.id)
      .filter((id): id is string => !!id);

    // Fetch the newly created records
    const createdInfluences = await this.prisma.influence.findMany({
      where: {
        id: {
          in: influenceIds, // Use only valid `id` values
        },
      },
    });

    // Update cache by influence ID
    createdInfluences.forEach((influence) => {
      this.influenceCache.set(influence.id, influence);
    });

    // Group influences by gameId and update cache for gameId if necessary
    if (data.length > 0 && data[0].gameId) {
      const gameId = data[0].gameId as string; // Ensure `gameId` is properly typed
      const currentCache = this.getInfluencesByGameId(gameId);
      const updatedCache = [...currentCache, ...createdInfluences];
      this.setInfluencesByGameId(gameId, updatedCache);
    }

    return createdInfluences;
  }

  // Additional method to clear cache (optional)
  clearCache(): void {
    this.influenceCache.clear();
  }

  private getInfluencesByGameId(gameId: string): Influence[] {
    // Retrieve all influences for a gameId
    const influences: Influence[] = [];
    this.influenceCache.forEach((influence) => {
      if (influence.gameId === gameId) {
        influences.push(influence);
      }
    });
    return influences;
  }

  private setInfluencesByGameId(gameId: string, influences: Influence[]): void {
    // Update the cache with new influences for a specific gameId
    influences.forEach((influence) => {
      this.influenceCache.set(influence.id, influence);
    });
  }
}
