import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { CompanyAwardTrackSpaceService } from '@server/company-award-track-space/company-award-track-space.service';

type Context = {
  companyAwardTrackSpaceService: CompanyAwardTrackSpaceService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getCompanyAwardTrackSpace: trpc.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { id } = input;
        const space = await ctx.companyAwardTrackSpaceService.getCompanyAwardTrackSpaceById(id);
        if (!space) {
          throw new Error('CompanyAwardTrackSpace not found');
        }
        return space;
      }),

    listCompanyAwardTrackSpaces: trpc.procedure
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
        return ctx.companyAwardTrackSpaceService.listCompanyAwardTrackSpaces({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),
  });
