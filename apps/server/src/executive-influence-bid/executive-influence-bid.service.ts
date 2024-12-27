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
  private executiveInfluenceBidCache = new Map<
    string,
    ExecutiveInfluenceBidWithRelations
  >();

  constructor(private prisma: PrismaService) {}

  // Retrieve a specific ExecutiveInfluenceBid by unique input
  async getExecutiveInfluenceBid(
    executiveInfluenceBidWhereUniqueInput: Prisma.ExecutiveInfluenceBidWhereUniqueInput,
  ): Promise<ExecutiveInfluenceBidWithRelations | null> {
    const bidId = executiveInfluenceBidWhereUniqueInput.id;

    if (!bidId) return null;

    // Check the cache
    if (this.executiveInfluenceBidCache.has(bidId)) {
      return this.executiveInfluenceBidCache.get(bidId) || null;
    }

    // Fetch from the database and update the cache
    const executiveInfluenceBid =
      await this.prisma.executiveInfluenceBid.findUnique({
        where: executiveInfluenceBidWhereUniqueInput,
        include: {
          game: true,
          toPlayer: true,
          fromPlayer: true,
          ExecutiveGameTurn: true,
          influenceBids: {
            include: {
              Influence: true, // Include the Influence relation to satisfy the type
            },
          },
        },
      });

    if (executiveInfluenceBid) {
      this.executiveInfluenceBidCache.set(bidId, executiveInfluenceBid);
    }

    return executiveInfluenceBid;
  }

  async findExecutiveInfluenceBid(
    where: Prisma.ExecutiveInfluenceBidWhereInput,
  ): Promise<ExecutiveInfluenceBidWithRelations | null> {
    // This method is less efficient for caching as it lacks a unique ID, so we skip caching here.
    return this.prisma.executiveInfluenceBid.findFirst({
      where,
      include: {
        game: true,
        toPlayer: true,
        fromPlayer: true,
        ExecutiveGameTurn: true,
        influenceBids: {
          include: {
            Influence: true, // Include the Influence relation to satisfy the type
          },
        },
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

    const executiveInfluenceBids =
      await this.prisma.executiveInfluenceBid.findMany({
        skip,
        take,
        cursor,
        where,
        orderBy,
        include: {
          toPlayer: true,
          fromPlayer: true,
          ExecutiveGameTurn: true,
          influenceBids: {
            include: {
              Influence: true,
            },
          },
        },
      });

    // Update cache with all retrieved bids
    executiveInfluenceBids.forEach((bid) => {
      if (bid.id) {
        this.executiveInfluenceBidCache.set(bid.id, bid);
      }
    });

    return executiveInfluenceBids;
  }

  // Create a new ExecutiveInfluenceBid
  async createExecutiveInfluenceBid(
    data: Prisma.ExecutiveInfluenceBidCreateInput,
    influence: Influence[],
  ): Promise<ExecutiveInfluenceBidWithRelations> {
    console.log('create executive influence bid', influence.map((inf) => inf.id)); 
    // Create the executive influence bid
    const executiveInfluenceBid =
      await this.prisma.executiveInfluenceBid.create({
        data,
        include: {
          game: true,
          toPlayer: true,
          fromPlayer: true,
          ExecutiveGameTurn: true,
          influenceBids: {
            include: {
              Influence: true, // Include the Influence relation
            },
          },
        },
      });

    // Create influence bids
    await this.prisma.influenceBid.createMany({
      data: influence.map((inf) => ({
        influenceId: inf.id,
        executiveInfluenceBidId: executiveInfluenceBid.id,
      })),
    });

    // Update all influences to location BRIBE
    await this.prisma.influence.updateMany({
      where: {
        id: {
          in: influence.map((inf) => inf.id),
        },
      },
      data: {
        influenceLocation: InfluenceLocation.BRIBE,
      },
    });

    // Refetch the executive influence bid with updated relations
    const updatedExecutiveInfluenceBid =
      await this.prisma.executiveInfluenceBid.findUnique({
        where: { id: executiveInfluenceBid.id },
        include: {
          game: true,
          toPlayer: true,
          fromPlayer: true,
          ExecutiveGameTurn: true,
          influenceBids: {
            include: {
              Influence: true, // Ensure Influence relation is included
            },
          },
        },
      });

    if (!updatedExecutiveInfluenceBid) {
      throw new Error('Failed to fetch the updated ExecutiveInfluenceBid');
    }

    // Update cache
    this.executiveInfluenceBidCache.set(
      updatedExecutiveInfluenceBid.id,
      updatedExecutiveInfluenceBid,
    );

    return updatedExecutiveInfluenceBid;
  }

  // Update an existing ExecutiveInfluenceBid
  // Update an existing ExecutiveInfluenceBid
  async updateExecutiveInfluenceBid(params: {
    where: Prisma.ExecutiveInfluenceBidWhereUniqueInput;
    data: Prisma.ExecutiveInfluenceBidUpdateInput;
  }): Promise<ExecutiveInfluenceBidWithRelations> {
    const { where, data } = params;

    const updatedBid = await this.prisma.executiveInfluenceBid.update({
      data,
      where,
      include: {
        game: true,
        toPlayer: true,
        fromPlayer: true,
        ExecutiveGameTurn: true,
        influenceBids: {
          include: {
            Influence: true, // Include the Influence relation
          },
        },
      },
    });

    // Update cache
    if (updatedBid.id) {
      this.executiveInfluenceBidCache.set(updatedBid.id, updatedBid);
    }

    return updatedBid;
  }

  // Delete an ExecutiveInfluenceBid
  async deleteExecutiveInfluenceBid(
    where: Prisma.ExecutiveInfluenceBidWhereUniqueInput,
  ): Promise<ExecutiveInfluenceBid> {
    const bidId = where.id;

    if (!bidId) {
      throw new Error('Invalid ExecutiveInfluenceBid ID');
    }

    const deletedBid = await this.prisma.executiveInfluenceBid.delete({
      where,
    });

    // Remove from cache
    this.executiveInfluenceBidCache.delete(bidId);

    return deletedBid;
  }

  // Clear cache (optional utility method)
  clearCache(): void {
    this.executiveInfluenceBidCache.clear();
  }
}
