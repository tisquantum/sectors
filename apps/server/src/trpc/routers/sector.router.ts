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

    listSectorsWithCompanies: trpc.procedure
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
        return ctx.sectorService.sectorsWithCompanies({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),
  });
