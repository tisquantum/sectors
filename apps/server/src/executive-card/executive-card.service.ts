import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, ExecutiveCard, CardLocation, CardSuit } from '@prisma/client';

@Injectable()
export class ExecutiveCardService {
  constructor(private prisma: PrismaService) {}

  // Retrieve the deck for a game by filtering for cards with the DECK location
  async getDeck(gameId: string): Promise<ExecutiveCard[]> {
    return this.listExecutiveCards({
      where: {
        gameId,
        cardLocation: CardLocation.DECK,
      },
    });
  }

  /**
   * Create a deck with four ranks of 1-10
   * @param gameId 
   */
  async createDeck(gameId: string): Promise<ExecutiveCard[]> {
    const deck: Prisma.ExecutiveCardCreateManyInput[] = [];
  
    // Create cards for each rank and value
    for (const rank of Object.values(CardSuit)) {
      for (let cardValue = 1; cardValue <= 10; cardValue++) {
        deck.push({
          gameId,
          cardValue,
          cardLocation: CardLocation.DECK,
          cardSuit: rank as CardSuit,
          isLocked: false,
        });
      }
    }
  
    // Use Prisma to create all cards in the deck
    await this.prisma.executiveCard.createMany({
      data: deck,
      skipDuplicates: true,
    });
  
    return this.getDeck(gameId);
  }

  // Shuffle the deck in memory
  async shuffle(executiveCards: ExecutiveCard[]): Promise<ExecutiveCard[]> {
    // Shuffle the deck array in memory
    const shuffledDeck = executiveCards.sort(() => Math.random() - 0.5);

    return shuffledDeck;
  }

  // Draw cards from the top of the in-memory shuffled deck
  async drawCards(gameId: string, cardsToDraw: number): Promise<ExecutiveCard[]> {
    // Retrieve the current deck
    let deck = await this.getDeck(gameId);
    //shuffle deck
    deck = await this.shuffle(deck);
    // If the deck is empty or fewer cards than requested are available, throw an error
    if (deck.length < cardsToDraw) {
      throw new Error('Not enough cards left in the deck');
    }

    // Draw the specified number of cards
    const drawnCards = deck.slice(0, cardsToDraw);
  
    // Return the drawn cards
    return drawnCards;
  }

  // Helper function to retrieve a specific ExecutiveCard by unique input
  async getExecutiveCard(
    executiveCardWhereUniqueInput: Prisma.ExecutiveCardWhereUniqueInput,
  ): Promise<ExecutiveCard | null> {
    return this.prisma.executiveCard.findUnique({
      where: executiveCardWhereUniqueInput,
      include: {
        Game: true,
        player: true,
      },
    });
  }

  // Helper function to list ExecutiveCards with filtering, pagination, and sorting
  async listExecutiveCards(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ExecutiveCardWhereUniqueInput;
    where?: Prisma.ExecutiveCardWhereInput;
    orderBy?: Prisma.ExecutiveCardOrderByWithRelationInput;
  }): Promise<ExecutiveCard[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.executiveCard.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        Game: true,
        player: true,
      },
    });
  }

  // Create a new ExecutiveCard
  async createExecutiveCard(data: Prisma.ExecutiveCardCreateInput): Promise<ExecutiveCard> {
    return this.prisma.executiveCard.create({
      data,
    });
  }

  // Create multiple ExecutiveCards
  async createManyExecutiveCards(
    data: Prisma.ExecutiveCardCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.executiveCard.createMany({
      data,
      skipDuplicates: true,
    });
  }

  // Update an existing ExecutiveCard
  async updateExecutiveCard(params: {
    where: Prisma.ExecutiveCardWhereUniqueInput;
    data: Prisma.ExecutiveCardUpdateInput;
  }): Promise<ExecutiveCard> {
    const { where, data } = params;
    return this.prisma.executiveCard.update({
      data,
      where,
    });
  }

  async updateExecutiveCards(
    data: Prisma.ExecutiveCardUpdateInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.executiveCard.updateMany({
      data,
    });
  }

  // Delete an ExecutiveCard
  async deleteExecutiveCard(
    where: Prisma.ExecutiveCardWhereUniqueInput,
  ): Promise<ExecutiveCard> {
    return this.prisma.executiveCard.delete({
      where,
    });
  }
}
