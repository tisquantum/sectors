import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, ExecutiveCard, CardLocation, CardRank } from '@prisma/client';

@Injectable()
export class ExecutiveCardService {
  constructor(private prisma: PrismaService) {}

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
    // Define an array to hold the new deck of cards
    const deck: Prisma.ExecutiveCardCreateManyInput[] = [];
  
    // Create four suits, each with ranks from 1 to 10
    let index = 0;
    for (const rank of Object.values(CardRank)) {
      for (let cardValue = 1; cardValue <= 10; cardValue++) {
        deck.push({
          gameId,
          cardValue,
          deckIndex: index,
          cardLocation: CardLocation.DECK,
          cardRank: rank as CardRank,
          isLocked: false,  // Assuming cards are unlocked by default
        });
        index++;
      }
    }
  
    // Use Prisma to create all cards in the deck
    await this.prisma.executiveCard.createMany({
      data: deck,
      skipDuplicates: true,
    });
  
    // Return the newly created deck for confirmation
    return this.getDeck(gameId);
  }

  //shuffle the deck
  async shuffleDeck(gameId: string): Promise<ExecutiveCard[]> {
    // Retrieve the current deck for the game
    const executiveCards = await this.getDeck(gameId);
  
    // Shuffle the deck array in memory
    const shuffledDeck = executiveCards.sort(() => Math.random() - 0.5);
  
    // Update deckIndex for each card in the shuffled deck
    const updatedDeck = shuffledDeck.map((card, index) => ({
      ...card,
      deckIndex: index,
    }));
  
    // Update the deckIndex for each card in the database
    await Promise.all(
      updatedDeck.map((card) =>
        this.prisma.executiveCard.update({
          where: { id: card.id },
          data: { deckIndex: card.deckIndex },
        })
      )
    );
  
    // Return the updated shuffled deck
    return this.getDeck(gameId);
  }

  async drawCards(gameId: string, cardsToDraw: number): Promise<ExecutiveCard[]> {
    // Retrieve the current deck, ordered by deckIndex
    const deck = await this.prisma.executiveCard.findMany({
      where: {
        gameId,
        cardLocation: CardLocation.DECK,
      },
      orderBy: {
        deckIndex: 'asc',
      },
      take: cardsToDraw,
    });
  
    // If there are fewer cards than requested, only those available are drawn
    if (deck.length === 0) {
      throw new Error('No cards left in the deck');
    }
  
    // Update each drawn card's location (e.g., moving it to HAND or another location)
    const drawnCards = await Promise.all(
      deck.map((card) =>
        this.prisma.executiveCard.update({
          where: { id: card.id },
          data: {deckIndex: null, // Removing deckIndex as it’s no longer in the deck
          },
        })
      )
    );
  
    // Update the deck indexes of remaining cards in the deck
    const remainingDeck = await this.prisma.executiveCard.findMany({
      where: {
        gameId,
        cardLocation: CardLocation.DECK,
      },
      orderBy: {
        deckIndex: 'asc',
      },
    });
  
    await Promise.all(
      remainingDeck.map((card, index) =>
        this.prisma.executiveCard.update({
          where: { id: card.id },
          data: { deckIndex: index },
        })
      )
    );
  
    return drawnCards;
  }
  

  // Retrieve a specific ExecutiveCard by unique input
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

  // List all ExecutiveCards with optional filtering, pagination, and sorting
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

  // Delete an ExecutiveCard
  async deleteExecutiveCard(
    where: Prisma.ExecutiveCardWhereUniqueInput,
  ): Promise<ExecutiveCard> {
    return this.prisma.executiveCard.delete({
      where,
    });
  }
}
