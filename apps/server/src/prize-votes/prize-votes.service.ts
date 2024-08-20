import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, PrizeVote } from '@prisma/client';

@Injectable()
export class PrizeVotesService {
  constructor(private prisma: PrismaService) {}

  // Fetch a single prize vote by its unique identifier
  async getPrizeVote(
    prizeVoteWhereUniqueInput: Prisma.PrizeVoteWhereUniqueInput,
  ): Promise<PrizeVote | null> {
    return this.prisma.prizeVote.findUnique({
      where: prizeVoteWhereUniqueInput,
      include: {
        Player: true,
        GameTurn: true,
        Prize: true,
      },
    });
  }

  // List prize votes with optional filters, pagination, and sorting
  async listPrizeVotes(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PrizeVoteWhereUniqueInput;
    where?: Prisma.PrizeVoteWhereInput;
    orderBy?: Prisma.PrizeVoteOrderByWithRelationInput;
  }): Promise<PrizeVote[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.prizeVote.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        Player: true,
        GameTurn: true,
        Prize: true,
      },
    });
  }

  // Create a new prize vote
  async createPrizeVote(data: Prisma.PrizeVoteCreateInput): Promise<PrizeVote> {
    //if player has already submit a vote for this game turn, throw
    const existingVote = await this.prisma.prizeVote.findFirst({
      where: {
        playerId: data.Player.connect?.id,
        gameTurnId: data.GameTurn.connect?.id,
      },
    });
    if (existingVote) {
      throw new Error('Player has already submitted a vote for this game turn');
    }
    return this.prisma.prizeVote.create({
      data: {
        ...data,
        Player: {
          connect: { id: data.Player.connect?.id },
        },
        GameTurn: {
          connect: { id: data.GameTurn.connect?.id },
        },
        Prize: {
          connect: { id: data.Prize.connect?.id },
        },
      },
    });
  }

  // Create multiple prize votes at once
  async createManyPrizeVotes(
    data: Prisma.PrizeVoteCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.prizeVote.createMany({
      data,
      skipDuplicates: true,
    });
  }

  // Update a prize vote by its unique identifier
  async updatePrizeVote(params: {
    where: Prisma.PrizeVoteWhereUniqueInput;
    data: Prisma.PrizeVoteUpdateInput;
  }): Promise<PrizeVote> {
    const { where, data } = params;
    return this.prisma.prizeVote.update({
      data,
      where,
    });
  }

  // Delete a prize vote by its unique identifier
  async deletePrizeVote(
    where: Prisma.PrizeVoteWhereUniqueInput,
  ): Promise<PrizeVote> {
    return this.prisma.prizeVote.delete({
      where,
    });
  }
}
