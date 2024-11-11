import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { ExecutiveCardService } from '@server/executive-card/executive-card.service';

type Context = {
  executiveCardService: ExecutiveCardService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    // Retrieve the deck for a game
    getDeck: trpc.procedure
      .input(z.object({ gameId: z.string() }))
      .query(async ({ input }) => {
        const { gameId } = input;
        const deck = await ctx.executiveCardService.getDeck(gameId);
        if (!deck) {
          throw new Error('Deck not found');
        }
        return deck;
      }),

    getDeckCardCount: trpc.procedure
      .input(z.object({ gameId: z.string() }))
      .query(async ({ input }) => {
        const { gameId } = input;
        const deck = await ctx.executiveCardService.getDeckCardCount(gameId);
        if (!deck) {
          throw new Error('Deck not found');
        }
        return deck;
      }),

    // Retrieve a specific ExecutiveCard by unique input
    getExecutiveCard: trpc.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { id } = input;
        const card = await ctx.executiveCardService.getExecutiveCard({ id });
        if (!card) {
          throw new Error('ExecutiveCard not found');
        }
        return card;
      }),

    // List all ExecutiveCards with optional filtering, pagination, and sorting
    listExecutiveCards: trpc.procedure
      .input(
        z.object({
          skip: z.number().optional(),
          take: z.number().optional(),
          cursor: z.string().optional(),
          where: z.any().optional(),
          orderBy: z.any().optional(),
        }),
      )
      .query(async ({ input }) => {
        const { skip, take, cursor, where, orderBy } = input;
        return ctx.executiveCardService.listExecutiveCards({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    listConcealedCards: trpc.procedure
      .input(
        z.object({
          where: z.object({
            playerId: z.string(),
          }),
        }),
      )
      .query(async ({ input }) => {
        const { where } = input;
        return ctx.executiveCardService.listConcealedCards(where);
      }),
  });
