import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { CompanyAwardTrackService } from '@server/company-award-track/company-award-track.service';

type Context = {
  companyAwardTrackService: CompanyAwardTrackService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getCompanyAwardTrack: trpc.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { id } = input;
        const track =
          await ctx.companyAwardTrackService.getCompanyAwardTrackById(id);
        if (!track) {
          throw new Error('CompanyAwardTrack not found');
        }
        return track;
      }),

    listCompanyAwardTracks: trpc.procedure
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
        return ctx.companyAwardTrackService.listCompanyAwardTracks({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),
  });
