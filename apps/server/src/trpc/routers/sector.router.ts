import { z } from 'zod';
import { SectorService } from '@server/sector/sector.service';
import { TrpcService } from '../trpc.service';
import { Prisma } from '@prisma/client';

type Context = {
  sectorService: SectorService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getSector: trpc.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { id } = input;
        const sector = await ctx.sectorService.sector({ id });
        if (!sector) {
          throw new Error('Sector not found');
        }
        return sector;
      }),

    listSectors: trpc.procedure
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
        return ctx.sectorService.sectors({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    createSector: trpc.procedure
      .input(
        z.object({
          name: z.string(),
          supply: z.number(),
          demand: z.number(),
          marketingPrice: z.number(),
          basePrice: z.number(),
          floatNumberMin: z.number(),
          floatNumberMax: z.number(),
          Company: z.any().optional(),
          Game: z.object({
            connect: z.object({ id: z.string() }).optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const data: Prisma.SectorCreateInput = input;
        delete data.id;
        return ctx.sectorService.createSector(data);
      }),

    createManySectors: trpc.procedure
      .input(z.array(z.any()))
      .mutation(async ({ input }) => {
        const data: Prisma.SectorCreateManyInput[] = input;
        data.forEach((d) => delete d.id);
        return ctx.sectorService.createManySectors(data);
      }),

    updateSector: trpc.procedure
      .input(
        z.object({
          id: z.string(),
          data: z.object({
            name: z.string().optional(),
            supply: z.number().optional(),
            demand: z.number().optional(),
            marketingPrice: z.number().optional(),
            basePrice: z.number().optional(),
            floatNumberMin: z.number().optional(),
            floatNumberMax: z.number().optional(),
            Company: z.any().optional(),
            Game: z
              .object({
                connect: z.object({ id: z.string() }).optional(),
              })
              .optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, data } = input;
        return ctx.sectorService.updateSector({ where: { id }, data });
      }),

    deleteSector: trpc.procedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const { id } = input;
        return ctx.sectorService.deleteSector({ id });
      }),
  });
