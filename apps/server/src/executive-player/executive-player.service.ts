import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, ExecutivePlayer } from '@prisma/client';
import {
  ExecutivePlayerWithAgendas,
  ExecutivePlayerWithCards,
  ExecutivePlayerWithRelations,
} from '@server/prisma/prisma.types';

@Injectable()
export class ExecutivePlayerService {
  private playerCache = new Map<string, ExecutivePlayerWithRelations>(); // Cache by player ID

  constructor(private prisma: PrismaService) {}

  // Retrieve a specific ExecutivePlayer by unique input
  async getExecutivePlayer(
    executivePlayerWhereUniqueInput: Prisma.ExecutivePlayerWhereUniqueInput,
  ): Promise<ExecutivePlayerWithRelations | null> {
    const playerId = executivePlayerWhereUniqueInput.id;

    if (!playerId) return null;

    return this.prisma.executivePlayer.findUnique({
      where: executivePlayerWhereUniqueInput,
      include: {
        user: true,
        victoryPoints: true,
        cards: true,
        selfInfluence: true,
        ownedByInfluence: true,
        agendas: true,
        executiveTricks: true,
        voteMarkerOwner: true,
        voteMarkerVoted: true,
      },
    });
  }

  async getExecutivePlayerNoRelations(
    executivePlayerWhereUniqueInput: Prisma.ExecutivePlayerWhereUniqueInput,
  ): Promise<ExecutivePlayer | null> {
    return this.prisma.executivePlayer.findUnique({
      where: executivePlayerWhereUniqueInput,
    });
  }

  async getExecutivePlayerAndAgendas(
    executivePlayerWhereUniqueInput: Prisma.ExecutivePlayerWhereUniqueInput,
  ): Promise<ExecutivePlayerWithAgendas | null> {
    const player = await this.getExecutivePlayer(
      executivePlayerWhereUniqueInput,
    );
    if (!player) return null;

    return {
      ...player,
      agendas: player.agendas,
    };
  }

  async getExecutivePlayerWithCards(
    executivePlayerWhereUniqueInput: Prisma.ExecutivePlayerWhereUniqueInput,
  ): Promise<ExecutivePlayerWithCards | null> {
    return this.prisma.executivePlayer.findUnique({
      where: executivePlayerWhereUniqueInput,
      include: {
        cards: true,
      },
    });
  }

  async getExecutivePlayerByUserIdAndGameId(
    userId: string,
    gameId: string,
  ): Promise<ExecutivePlayerWithRelations | null> {
    return this.prisma.executivePlayer.findFirst({
      where: {
        userId,
        gameId,
      },
      include: {
        user: true,
        victoryPoints: true,
        cards: true,
        selfInfluence: true,
        ownedByInfluence: true,
        agendas: true,
        executiveTricks: true,
        voteMarkerVoted: true,
        voteMarkerOwner: true,
      },
    });
  }

  async findExecutivePlayer(
    where: Prisma.ExecutivePlayerWhereInput,
  ): Promise<ExecutivePlayer | null> {
    return this.prisma.executivePlayer.findFirst({
      where,
    });
  }

  // List all ExecutivePlayers with optional filtering, pagination, and sorting
  async listExecutivePlayers(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ExecutivePlayerWhereUniqueInput;
    where?: Prisma.ExecutivePlayerWhereInput;
    orderBy?: Prisma.ExecutivePlayerOrderByWithRelationInput;
  }): Promise<ExecutivePlayerWithRelations[]> {
    const { skip, take, cursor, where, orderBy } = params;

    return this.prisma.executivePlayer.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        victoryPoints: true,
        cards: true,
        user: true,
        selfInfluence: true,
        ownedByInfluence: true,
        agendas: true,
        executiveTricks: true,
        voteMarkerVoted: true,
        voteMarkerOwner: true,
      },
    });
  }

  async listExecutivePlayersNoRelations(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ExecutivePlayerWhereUniqueInput;
    where?: Prisma.ExecutivePlayerWhereInput;
    orderBy?: Prisma.ExecutivePlayerOrderByWithRelationInput;
    gameId?: string; // Add gameId for filtering
  }): Promise<ExecutivePlayer[]> {
    const { skip, take, cursor, where, orderBy, gameId } = params;

    return this.prisma.executivePlayer.findMany({
      skip: skip,
      take: take,
      cursor,
      where: {
        ...where,
        ...(gameId ? { gameId } : {}),
      },
      orderBy,
    });
  }

  // Create a new ExecutivePlayer
  async createExecutivePlayer(
    data: Prisma.ExecutivePlayerCreateInput,
  ): Promise<ExecutivePlayer> {
    const player = await this.prisma.executivePlayer.create({
      data,
    });

    //get executive player with relations
    this.getExecutivePlayer({
      id: player.id,
    }).then((player) => {
      if (!player) return;
      // Update cache
      this.playerCache.set(player.id, player as ExecutivePlayerWithRelations);
    });
    return player;
  }

  // Create multiple ExecutivePlayers
  async createManyExecutivePlayers(
    data: Prisma.ExecutivePlayerCreateManyInput[],
  ): Promise<ExecutivePlayer[]> {
    const players = await this.prisma.executivePlayer.createManyAndReturn({
      data,
      skipDuplicates: true,
    });

    //get players with relations
    this.listExecutivePlayers({
      where: {
        id: {
          in: players.map((player) => player.id),
        },
      },
    }).then((players) => {
      // Update cache
      players.forEach((player) => {
        this.playerCache.set(player.id, player as ExecutivePlayerWithRelations);
      });
    });

    return players;
  }

  // Update an existing ExecutivePlayer
  async updateExecutivePlayer(params: {
    where: Prisma.ExecutivePlayerWhereUniqueInput;
    data: Prisma.ExecutivePlayerUpdateInput;
  }): Promise<ExecutivePlayer> {
    const { where, data } = params;

    const updatedPlayer = await this.prisma.executivePlayer.update({
      data,
      where,
    });

    // Update cache
    if (updatedPlayer.id) {
      this.playerCache.set(
        updatedPlayer.id,
        updatedPlayer as ExecutivePlayerWithRelations,
      );
    }

    return updatedPlayer;
  }

  async updateManyExecutivePlayers(params: {
    where: Prisma.ExecutivePlayerWhereInput;
    data: Prisma.ExecutivePlayerUpdateManyMutationInput;
  }): Promise<Prisma.BatchPayload> {
    const { where, data } = params;

    return this.prisma.executivePlayer.updateMany({
      data,
      where,
    });
  }

  // Delete an ExecutivePlayer
  async deleteExecutivePlayer(
    where: Prisma.ExecutivePlayerWhereUniqueInput,
  ): Promise<ExecutivePlayer> {
    const deletedPlayer = await this.prisma.executivePlayer.delete({
      where,
    });

    // Remove from cache
    this.playerCache.delete(deletedPlayer.id);

    return deletedPlayer;
  }

  // Cache management methods
  clearCache(): void {
    this.playerCache.clear();
  }
}
