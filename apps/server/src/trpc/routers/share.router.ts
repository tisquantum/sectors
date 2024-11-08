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

    listSharesWithRelations: trpc.procedure
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
        return ctx.shareService.sharesWithRelations({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),
  });
