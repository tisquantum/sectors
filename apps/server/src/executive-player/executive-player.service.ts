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

    // Check the cache first
    if (this.playerCache.has(playerId)) {
      return this.playerCache.get(playerId) || null;
    }

    // Fetch from the database if not in cache
    const player = await this.prisma.executivePlayer.findUnique({
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

    if (player) {
      this.playerCache.set(playerId, player);
    }

    return player;
  }

  async getExecutivePlayerAndAgendas(
    executivePlayerWhereUniqueInput: Prisma.ExecutivePlayerWhereUniqueInput,
  ): Promise<ExecutivePlayerWithAgendas | null> {
    const player = await this.getExecutivePlayer(executivePlayerWhereUniqueInput);
    if (!player) return null;

    return {
      ...player,
      agendas: player.agendas,
    };
  }

  async getExecutivePlayerWithCards(
    executivePlayerWhereUniqueInput: Prisma.ExecutivePlayerWhereUniqueInput,
  ): Promise<ExecutivePlayerWithCards | null> {
    const player = await this.getExecutivePlayer(executivePlayerWhereUniqueInput);
    if (!player) return null;

    return {
      ...player,
      cards: player.cards,
    };
  }

  async getExecutivePlayerByUserIdAndGameId(
    userId: string,
    gameId: string,
  ): Promise<ExecutivePlayerWithRelations | null> {
    const cachedPlayer = [...this.playerCache.values()].find(
      (player) => player.userId === userId && player.gameId === gameId,
    );

    if (cachedPlayer) {
      return cachedPlayer;
    }

    // Fetch from the database if not cached
    const player = await this.prisma.executivePlayer.findFirst({
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

    if (player) {
      this.playerCache.set(player.id, player);
    }

    return player;
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

    const players = await this.prisma.executivePlayer.findMany({
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

    // Cache the results
    players.forEach((player) => {
      this.playerCache.set(player.id, player);
    });

    return players;
  }

  async listExecutivePlayersNoRelations(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ExecutivePlayerWhereUniqueInput;
    where?: Prisma.ExecutivePlayerWhereInput;
    orderBy?: Prisma.ExecutivePlayerOrderByWithRelationInput;
  }): Promise<ExecutivePlayer[]> {
    const { skip, take, cursor, where, orderBy } = params;

    return this.prisma.executivePlayer.findMany({
      skip,
      take,
      cursor,
      where,
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

    // Update cache
    this.playerCache.set(player.id, player as ExecutivePlayerWithRelations);

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

    // Update cache
    players.forEach((player) => {
      this.playerCache.set(player.id, player as ExecutivePlayerWithRelations);
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
      this.playerCache.set(updatedPlayer.id, updatedPlayer as ExecutivePlayerWithRelations);
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
