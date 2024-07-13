import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { Prisma, ResearchCardEffect, SectorName } from '@prisma/client';
import { ResearchDeckService } from '@server/research-deck/research-deck.service';

type Context = {
  researchDeckService: ResearchDeckService;
};

const ResearchDeckWhereUniqueInputSchema = z.object({
  id: z.number(),
});

const ResearchDeckCreateInputSchema = z.object({
  gameId: z.string(),
});

const CardWhereUniqueInputSchema = z.object({
  id: z.number(),
});

const CardCreateWithoutResearchDeckInputSchema = z.object({
  name: z.string(),
  description: z.string(),
  sector: z.nativeEnum(SectorName),
  effect: z.nativeEnum(ResearchCardEffect),
  Game: z.object({ connect: z.object({ id: z.string() }) }),
});

const CardUpdateWithoutResearchDeckInputSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  sector: z.nativeEnum(SectorName).optional(),
  effect: z.nativeEnum(ResearchCardEffect).optional(),
});

const CardUpdateWithWhereUniqueWithoutResearchDeckInputSchema = z.object({
  where: CardWhereUniqueInputSchema,
  data: CardUpdateWithoutResearchDeckInputSchema,
});

const CardUpdateManyWithoutResearchDeckNestedInputSchema = z.object({
  create: z.array(CardCreateWithoutResearchDeckInputSchema).optional(),
  connect: z.array(CardWhereUniqueInputSchema).optional(),
  disconnect: z.array(CardWhereUniqueInputSchema).optional(),
  delete: z.array(CardWhereUniqueInputSchema).optional(),
  update: z
    .array(CardUpdateWithWhereUniqueWithoutResearchDeckInputSchema)
    .optional(),
});

const ResearchDeckUpdateInputSchema = z.object({
  gameId: z.string().optional(),
  cards: CardUpdateManyWithoutResearchDeckNestedInputSchema.optional(),
});

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getResearchDeck: trpc.procedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { id } = input;
        const researchDeck = await ctx.researchDeckService.researchDeck({ id });
        if (!researchDeck) {
          throw new Error('ResearchDeck not found');
        }
        return researchDeck;
      }),
    getResearchDeckFirst: trpc.procedure
      .input(
        z.object({
          where: z.any().optional(),
          orderBy: z.any().optional(),
        }),
      )
      .query(async ({ input }) => {
        const { where, orderBy } = input;
        return ctx.researchDeckService.researchDeckFirst({ where, orderBy });
      }),

    listResearchDecks: trpc.procedure
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
        return ctx.researchDeckService.researchDecks({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    createResearchDeck: trpc.procedure
      .input(ResearchDeckCreateInputSchema)
      .mutation(async ({ input }) => {
        const { gameId, ...rest } = input;
        const data = { ...rest, Game: { connect: { id: gameId } } };
        return ctx.researchDeckService.createResearchDeck(data);
      }),

    updateResearchDeck: trpc.procedure
      .input(
        z.object({
          id: z.number(),
          data: ResearchDeckUpdateInputSchema,
        }),
      )
      .mutation(async ({ input }) => {
        const { id, data } = input;
        const { gameId, ...rest } = data;
        const updateData = { ...rest, Game: { connect: { id: gameId } } };
        return ctx.researchDeckService.updateResearchDeck({
          where: { id },
          data: updateData,
        });
      }),

    deleteResearchDeck: trpc.procedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { id } = input;
        return ctx.researchDeckService.deleteResearchDeck({ id });
      }),
  });
