import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { PrismaService } from '@server/prisma/prisma.service';
import { VoteMarkerWithRelations } from '@server/prisma/prisma.types';

type Context = {
  prismaService: PrismaService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    // Retrieve a specific ExecutiveVoteMarker by unique input
    getExecutiveVoteMarker: trpc.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { id } = input;
        return ctx.prismaService.voteMarker.findUnique({
          where: { id },
          include: {
            owningPlayer: true,
            votedPlayer: true,
          },
        }) as Promise<VoteMarkerWithRelations | null>;
      }),

    // List all ExecutiveVoteMarkers with optional filtering, pagination, and sorting
    listExecutiveVoteMarkers: trpc.procedure
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
        return ctx.prismaService.voteMarker.findMany({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
          include: {
            owningPlayer: true,
            votedPlayer: true,
          },
        }) as Promise<VoteMarkerWithRelations[]>;
      }),
  });
