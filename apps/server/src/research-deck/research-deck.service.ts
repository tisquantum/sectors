import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, ResearchDeck } from '@prisma/client';
import { ResearchDeckWithCards } from '@server/prisma/prisma.types';

@Injectable()
export class ResearchDeckService {
  constructor(private prisma: PrismaService) {}

  async researchDeck(
    researchDeckWhereUniqueInput: Prisma.ResearchDeckWhereUniqueInput,
  ): Promise<ResearchDeckWithCards | null> {
    return this.prisma.researchDeck.findUnique({
      where: researchDeckWhereUniqueInput,
      include: {
        cards: true,
      },
    });
  }

  async researchDeckFirst(params: {
    where?: Prisma.ResearchDeckWhereInput;
    orderBy?: Prisma.ResearchDeckOrderByWithRelationInput;
  }): Promise<ResearchDeckWithCards | null> {
    const { where, orderBy } = params;
    return this.prisma.researchDeck.findFirst({
      where,
      orderBy,
      include: {
        cards: true,
      },
    });
  }

  async researchDecks(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ResearchDeckWhereUniqueInput;
    where?: Prisma.ResearchDeckWhereInput;
    orderBy?: Prisma.ResearchDeckOrderByWithRelationInput;
  }): Promise<ResearchDeck[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.researchDeck.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createResearchDeck(
    data: Prisma.ResearchDeckCreateInput,
  ): Promise<ResearchDeck> {
    return this.prisma.researchDeck.create({
      data,
    });
  }

  async updateResearchDeck(params: {
    where: Prisma.ResearchDeckWhereUniqueInput;
    data: Prisma.ResearchDeckUpdateInput;
  }): Promise<ResearchDeck> {
    const { where, data } = params;
    return this.prisma.researchDeck.update({
      data,
      where,
    });
  }

  async deleteResearchDeck(
    where: Prisma.ResearchDeckWhereUniqueInput,
  ): Promise<ResearchDeck> {
    return this.prisma.researchDeck.delete({
      where,
    });
  }
}
