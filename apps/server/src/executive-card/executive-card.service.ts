import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, ExecutiveCard, CardLocation, CardSuit } from '@prisma/client';

@Injectable()
export class ExecutiveCardService {
  private cardCache = new Map<string, ExecutiveCard[]>(); // Cache by gameId

  constructor(private prisma: PrismaService) {}

  // Retrieve the deck for a game by filtering for cards with the DECK location
  async getDeck(gameId: string): Promise<ExecutiveCard[]> {
    // Check cache for the deck
    if (this.cardCache.has(gameId)) {
      //if deck is empty, look at tdb
      if (this.cardCache.get(gameId)?.length === 0) {
        const deck = await this.listExecutiveCards({
          where: {
            gameId,
            cardLocation: CardLocation.DECK,
          },
        });
        return deck;
      }
      return (
        this.cardCache
          .get(gameId)
          ?.filter((card) => card.cardLocation === CardLocation.DECK) || []
      );
    }

    // Fetch from database if not cached
    const deck = await this.listExecutiveCards({
      where: {
        gameId,
        cardLocation: CardLocation.DECK,
      },
    });

    return deck;
  }

  async getDeckCardCount(gameId: string): Promise<number> {
    const deck = await this.getDeck(gameId);
    return deck.length;
  }

  // Create a deck with four ranks of 1-10
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

    // Fetch and cache the new deck
    const createdDeck = await this.getDeck(gameId);
    this.updateCache(gameId, createdDeck);

    return createdDeck;
  }

  // Shuffle the deck in memory
  async shuffle(executiveCards: ExecutiveCard[]): Promise<ExecutiveCard[]> {
    // Shuffle the deck array in memory
    return executiveCards.sort(() => Math.random() - 0.5);
  }

  // Draw cards from the top of the in-memory shuffled deck
  async drawCards(
    gameId: string,
    cardsToDraw: number,
  ): Promise<ExecutiveCard[]> {
    // Retrieve the current deck
    let deck = await this.getDeck(gameId);

    // Shuffle the deck
    deck = await this.shuffle(deck);

    // If the deck is empty or fewer cards than requested are available, throw an error
    if (deck.length < cardsToDraw) {
      throw new Error('Not enough cards left in the deck');
    }

    // Draw the specified number of cards
    const drawnCards = deck.slice(0, cardsToDraw);

    return drawnCards;
  }

  // Helper function to retrieve a specific ExecutiveCard by unique input
  async getExecutiveCard(
    executiveCardWhereUniqueInput: Prisma.ExecutiveCardWhereUniqueInput,
  ): Promise<ExecutiveCard | null> {
    const cardId = executiveCardWhereUniqueInput.id;

    if (!cardId) return null;

    // Check cache for the card
    for (const cards of this.cardCache.values()) {
      const card = cards.find((c) => c.id === cardId);
      if (card) return card;
    }

    // Fetch from database if not cached
    const executiveCard = await this.prisma.executiveCard.findUnique({
      where: executiveCardWhereUniqueInput,
    });

    return executiveCard;
  }

  // Helper function to list ExecutiveCards
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
    });
  }

  async createExecutiveCard(
    data: Prisma.ExecutiveCardCreateInput,
  ): Promise<ExecutiveCard> {
    const card = await this.prisma.executiveCard.create({
      data,
    });

    // Update cache
    this.addToCache(card.gameId, card);

    return card;
  }

  async updateExecutiveCard(params: {
    where: Prisma.ExecutiveCardWhereUniqueInput;
    data: Prisma.ExecutiveCardUpdateInput;
  }): Promise<ExecutiveCard> {
    const { where, data } = params;

    // Check cache for the card
    let cachedCard = [...this.cardCache.values()]
      .flat()
      .find((card) => card.id === where.id);

    if (!cachedCard) {
      // Fallback to fetching from database if not in cache
      const dbCard = await this.prisma.executiveCard.findUnique({
        where,
      });

      if (!dbCard) {
        throw new Error('Card not found');
      }

      cachedCard = dbCard; // Ensure cachedCard is assigned a valid value
    }

    // Resolve data fields for the simulated updated card
    const updatedCard: ExecutiveCard = {
      ...cachedCard,
      ...(data as Partial<ExecutiveCard>), // Cast data to match ExecutiveCard structure
      updatedAt: new Date(), // Simulate the updated timestamp
    };

    // Update the cache
    this.updateCardInCache(updatedCard.gameId, updatedCard);

    // Run Prisma update in the background
    this.prisma.executiveCard
      .update({
        where,
        data,
      })
      .catch((err) => {
        console.error('Failed to update card in database:', err);
      });

    // Return the updated card from the cache immediately
    return updatedCard;
  }

  async deleteExecutiveCard(
    where: Prisma.ExecutiveCardWhereUniqueInput,
  ): Promise<ExecutiveCard> {
    const card = await this.prisma.executiveCard.delete({
      where,
    });

    // Remove from cache
    this.removeFromCache(card.gameId, card.id);

    return card;
  }

  async listConcealedCards(where: {
    playerId: string;
  }): Promise<Partial<ExecutiveCard>[]> {
    // Find all cards for the player in the cache
    const cachedCards = [...this.cardCache.values()]
      .flat()
      .filter((card) => card.playerId === where.playerId);

    if (cachedCards.length > 0) {
      // Conceal `cardValue` and `cardSuit` for cards in HAND
      return cachedCards.map((card) => {
        if (card.cardLocation === CardLocation.HAND) {
          return {
            id: card.id,
            gameId: card.gameId,
            playerId: card.playerId,
            cardLocation: card.cardLocation,
            isLocked: card.isLocked,
            createdAt: card.createdAt,
            updatedAt: card.updatedAt,
          };
        }
        // Return full card data for non-HAND cards
        return card;
      });
    }

    // Fallback to database if not found in cache
    const allCards = await this.prisma.executiveCard.findMany({
      where: {
        playerId: where.playerId,
      },
    });

    // Conceal `cardValue` and `cardSuit` for cards in HAND
    const concealedCards = allCards.map((card) => {
      if (card.cardLocation === CardLocation.HAND) {
        return {
          id: card.id,
          gameId: card.gameId,
          playerId: card.playerId,
          cardLocation: card.cardLocation,
          isLocked: card.isLocked,
          createdAt: card.createdAt,
          updatedAt: card.updatedAt,
        };
      }
      // Return full card data for non-HAND cards
      return card;
    });

    return concealedCards;
  }

  async exchangeBribe(
    bribePlayerId: string,
    giftPlayerId: string,
    isLocked = false,
  ): Promise<ExecutiveCard> {
    // Retrieve the bribe card from the cache or database
    let bribeCard: ExecutiveCard | undefined = [...this.cardCache.values()]
      .flat()
      .find(
        (card) =>
          card.playerId === bribePlayerId &&
          card.cardLocation === CardLocation.BRIBE,
      );

    if (!bribeCard) {
      // Fallback to database if not in cache
      const dbBribeCard = await this.prisma.executiveCard.findFirst({
        where: {
          playerId: bribePlayerId,
          cardLocation: CardLocation.BRIBE,
        },
      });

      if (!dbBribeCard) {
        throw new Error('No bribe card found');
      }

      bribeCard = dbBribeCard; // Assign the card found in the database
    }

    // Move the bribe card to the other player as a gift
    const updatedCard = await this.prisma.executiveCard.update({
      where: {
        id: bribeCard.id,
      },
      data: {
        playerId: giftPlayerId,
        cardLocation: CardLocation.GIFT,
        isLocked,
      },
    });

    // Update the cache
    this.updateCardInCache(updatedCard.gameId, updatedCard);

    return updatedCard;
  }

  // Cache management methods
  private updateCache(gameId: string, cards: ExecutiveCard[]): void {
    this.cardCache.set(gameId, cards);
  }

  private addToCache(gameId: string, card: ExecutiveCard): void {
    const cards = this.cardCache.get(gameId) || [];
    this.cardCache.set(gameId, [...cards, card]);
  }

  private updateCardInCache(gameId: string, card: ExecutiveCard): void {
    const cards = this.cardCache.get(gameId) || [];
    const index = cards.findIndex((c) => c.id === card.id);

    if (index >= 0) {
      cards[index] = card;
      this.cardCache.set(gameId, cards);
    }
  }

  private removeFromCache(gameId: string, cardId: string): void {
    const cards = this.cardCache.get(gameId) || [];
    this.cardCache.set(
      gameId,
      cards.filter((c) => c.id !== cardId),
    );
  }

  async findExecutiveCard(
    where: Prisma.ExecutiveCardWhereInput,
  ): Promise<ExecutiveCard | null> {
    // Check cache for matching card
    for (const cards of this.cardCache.values()) {
      const matchingCard = cards.find((card) => {
        return Object.entries(where).every(([key, value]) => {
          // Ensure the key exists in the card object and matches the value
          return card[key as keyof ExecutiveCard] === value;
        });
      });
      if (matchingCard) return matchingCard;
    }

    // Fallback to database if not found in cache
    return this.prisma.executiveCard.findFirst({
      where,
    });
  }

  async updateManyExecutiveCards(params: {
    where: Prisma.ExecutiveCardWhereInput;
    data: Prisma.ExecutiveCardUncheckedUpdateManyInput;
  }): Promise<Prisma.BatchPayload> {
    const { where, data } = params;

    // Update records in the database
    const result = await this.prisma.executiveCard.updateMany({
      where,
      data,
    });

    // Update the cache
    const updatedCards = await this.prisma.executiveCard.findMany({
      where,
    });

    if (updatedCards.length > 0) {
      const gameId = updatedCards[0].gameId;
      const currentCache = this.cardCache.get(gameId) || [];

      // Update or replace cards in the cache
      const updatedCache = currentCache.map(
        (card) =>
          updatedCards.find((updatedCard) => updatedCard.id === card.id) ||
          card,
      );

      this.cardCache.set(gameId, updatedCache);
    }

    return result;
  }

  clearCache(): void {
    this.cardCache.clear();
  }
}
