import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { ShareService } from '@server/share/share.service';
import { Prisma, ShareLocation } from '@prisma/client';
import { CompanyService } from '@server/company/company.service';

type Context = {
  shareService: ShareService;
  companyService: CompanyService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getShare: trpc.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { id } = input;
        const share = await ctx.shareService.share({ id });
        if (!share) {
          throw new Error('Share not found');
        }
        return share;
      }),

    listShares: trpc.procedure
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
        return ctx.shareService.shares({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    createShare: trpc.procedure
      .input(
        z.object({
          companyId: z.string(),
          location: z.nativeEnum(ShareLocation),
        }),
      )
      .mutation(async ({ input }) => {
        //get company
        const company = await ctx.companyService.company({ id: input.companyId });
        // Implement creation logic
        return ctx.shareService.createShare({
            price: company?.currentStockPrice ?? 0,
            location: input.location,
            Game: { connect: { id: company?.gameId } },
            Company: { connect: { id: input.companyId } },
        });
      }),

    updateShare: trpc.procedure
      .input(
        z.object({
          id: z.string(),
          // Define your update schema using Zod
          // Example: name: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        // Implement update logic
        const { id, ...data } = input;
        return ctx.shareService.updateShare({ where: { id }, data });
      }),

    deleteShare: trpc.procedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        // Implement deletion logic
        const { id } = input;
        return ctx.shareService.deleteShare({ id });
      }),
  });
