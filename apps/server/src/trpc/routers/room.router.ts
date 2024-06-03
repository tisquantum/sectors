import { z } from 'zod';
import { RoomService } from '@server/rooms/rooms.service';
import { TrpcService } from '../trpc.service';
import { Prisma } from '@prisma/client';

type Context = {
  roomService: RoomService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getRoom: trpc.procedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { id } = input;
        const room = await ctx.roomService.room({ id });
        if (!room) {
          throw new Error('Room not found');
        }
        return room;
      }),

    listRooms: trpc.procedure
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
        return ctx.roomService.rooms({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    createRoom: trpc.procedure
      .input(
        z.object({
          name: z.string(),
          gameId: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { name, gameId } = input;
        const data: Prisma.RoomCreateInput = {
          name,
        };
        if (gameId) {
          data.game = {
            connect: { id: gameId },
          };
        }
        return ctx.roomService.createRoom(data);
      }),

    updateRoom: trpc.procedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            name: z.string().optional(),
            gameId: z.string().optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, data } = input;
        return ctx.roomService.updateRoom({ where: { id }, data });
      }),

    deleteRoom: trpc.procedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { id } = input;
        return ctx.roomService.deleteRoom({ id });
      }),
  });
