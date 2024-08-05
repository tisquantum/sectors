import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { Prisma } from '@prisma/client';
import { CardsService } from '@server/cards/cards.service';

type Context = {
  cardsService: CardsService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getCardById: trpc.procedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { id } = input;
        const card = await ctx.cardsService.getCardById(id);
        if (!card) {
          throw new Error('Card not found');
        }
        return card;
      }),

    listCards: trpc.procedure
      .input(
        z.object({
          skip: z.number().optional(),
          take: z.number().optional(),
          cursor: z.number().optional(),
          where: z.any().optional(),
          orderBy: z.any().optional(),
        }),
      )
      .query(async ({ input }) => {
        const { skip, take, cursor, where, orderBy } = input;
        return ctx.cardsService.listCards({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),
  });
