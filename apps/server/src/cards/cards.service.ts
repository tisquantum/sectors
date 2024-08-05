import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Adjust the path as needed
import { Prisma, Card } from '@prisma/client'; // Adjust the path as needed

@Injectable()
export class CardsService {
  constructor(private prisma: PrismaService) {}

  async createCard(data: Prisma.CardCreateInput): Promise<Card> {
    return this.prisma.card.create({
      data,
    });
  }

  async createManyCards(data: Prisma.CardCreateManyInput[]): Promise<Card[]> {
    //remove id
    data.forEach((d) => delete d.id);
    return this.prisma.card.createManyAndReturn({
      data,
    });
  }

  async getCardById(id: number): Promise<Card | null> {
    return this.prisma.card.findUnique({
      where: { id },
    });
  }

  async getAllCards(): Promise<Card[]> {
    return this.prisma.card.findMany();
  }

  async listCards(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CardWhereUniqueInput;
    where?: Prisma.CardWhereInput;
    orderBy?: Prisma.CardOrderByWithRelationInput;
  }): Promise<Card[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.card.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async updateCard(id: number, data: Prisma.CardUpdateInput): Promise<Card> {
    return this.prisma.card.update({
      where: { id },
      data,
    });
  }

  async deleteCard(id: number): Promise<Card> {
    return this.prisma.card.delete({
      where: { id },
    });
  }
}
