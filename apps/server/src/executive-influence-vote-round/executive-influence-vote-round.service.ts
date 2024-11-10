import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, ExecutiveInfluenceVoteRound } from '@prisma/client';

@Injectable()
export class ExecutiveInfluenceVoteRoundService {
  constructor(private readonly prisma: PrismaService) {}

  // Retrieve a specific ExecutiveInfluenceVoteRound by unique input
  async getVoteRound(
    where: Prisma.ExecutiveInfluenceVoteRoundWhereUniqueInput,
  ): Promise<ExecutiveInfluenceVoteRound | null> {
    return this.prisma.executiveInfluenceVoteRound.findUnique({
      where,
      include: {
        game: true,
        playerVotes: true,
        ExecutiveGameTurn: true,
      },
    });
  }

  // List all ExecutiveInfluenceVoteRounds with optional filtering, pagination, and sorting
  async listVoteRounds(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ExecutiveInfluenceVoteRoundWhereUniqueInput;
    where?: Prisma.ExecutiveInfluenceVoteRoundWhereInput;
    orderBy?: Prisma.ExecutiveInfluenceVoteRoundOrderByWithRelationInput;
  }): Promise<ExecutiveInfluenceVoteRound[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.executiveInfluenceVoteRound.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        game: true,
        playerVotes: true,
        ExecutiveGameTurn: true,
      },
    });
  }

  // Create a new ExecutiveInfluenceVoteRound
  async createVoteRound(
    data: Prisma.ExecutiveInfluenceVoteRoundCreateInput,
  ): Promise<ExecutiveInfluenceVoteRound> {
    return this.prisma.executiveInfluenceVoteRound.create({
      data,
    });
  }

  // Update an existing ExecutiveInfluenceVoteRound
  async updateVoteRound(params: {
    where: Prisma.ExecutiveInfluenceVoteRoundWhereUniqueInput;
    data: Prisma.ExecutiveInfluenceVoteRoundUpdateInput;
  }): Promise<ExecutiveInfluenceVoteRound> {
    const { where, data } = params;
    return this.prisma.executiveInfluenceVoteRound.update({
      where,
      data,
    });
  }

  // Delete an ExecutiveInfluenceVoteRound
  async deleteVoteRound(
    where: Prisma.ExecutiveInfluenceVoteRoundWhereUniqueInput,
  ): Promise<ExecutiveInfluenceVoteRound> {
    return this.prisma.executiveInfluenceVoteRound.delete({
      where,
    });
  }
}
