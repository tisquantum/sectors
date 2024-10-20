import { z } from 'zod';
import { RoomUserService } from '@server/room-user/room-user.service';
import { TrpcService } from '../trpc.service';
import { Prisma } from '@prisma/client';
import { PusherService } from 'nestjs-pusher';
import {
  EVENT_ROOM_JOINED,
  EVENT_ROOM_LEFT,
  EVENT_ROOM_KICK,
  getRoomChannelId,
} from '@server/pusher/pusher.types';

type Context = {
  roomUserService: RoomUserService;
  pusherService: PusherService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getRoomUser: trpc.procedure
      .input(z.object({ userId: z.string(), roomId: z.number() }))
      .query(async ({ input }) => {
        const { userId, roomId } = input;
        const roomUser = await ctx.roomUserService.roomUser({
          userId_roomId: { userId, roomId },
        });
        if (!roomUser) {
          throw new Error('RoomUser not found');
        }
        return roomUser;
      }),

    listRoomUsers: trpc.procedure
      .input(
        z.object({
          skip: z.number().optional(),
          take: z.number().optional(),
          cursor: z.any().optional(),
          where: z.any().optional(),
          orderBy: z.any().optional(),
        }),
      )
      .query(async ({ input }) => {
        const { skip, take, cursor, where, orderBy } = input;
        return ctx.roomUserService.roomUsers({
          skip,
          take,
          cursor,
          where,
          orderBy,
        });
      }),

    joinRoom: trpc.procedure
      .input(
        z.object({
          userId: z.string(),
          roomId: z.number(),
          roomHost: z.boolean().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { userId, roomId, roomHost } = input;

        try {
          const roomUser = await ctx.roomUserService.createRoomUser({
            user: { connect: { id: userId } },
            room: { connect: { id: roomId } },
            roomHost,
          });

          //pusher logic
          ctx.pusherService
            .trigger(getRoomChannelId(roomId), EVENT_ROOM_JOINED, roomUser)
            .catch((error) => {
              console.error('Error triggering pusher event:', error);
            });

          return {
            success: true,
            message: 'User successfully added to the room',
            data: roomUser,
          };
        } catch (error: unknown) {
          // Type guard to check if the error is an instance of PrismaClientKnownRequestError
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Handle specific error if user is already in the room
            if (error.code === 'P2002') {
              // Prisma unique constraint violation error code
              return {
                success: false,
                message: 'User is already in the room',
              };
            }
          }

          // Handle other errors
          return {
            success: false,
            message: 'An unexpected error occurred',
            error: (error as Error).message, // Type assertion to access the message property
          };
        }
      }),

    updateRoomUser: trpc.procedure
      .input(
        z.object({
          userId: z.string(),
          roomId: z.number(),
          data: z.object({
            newUserId: z.string().optional(),
            newRoomId: z.number().optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const { userId, roomId, data } = input;
        const updateData: Prisma.RoomUserUpdateInput = {};

        if (data.newUserId) {
          updateData.user = {
            connect: { id: data.newUserId },
          };
        }

        if (data.newRoomId) {
          updateData.room = {
            connect: { id: data.newRoomId },
          };
        }

        return ctx.roomUserService.updateRoomUser({
          where: { userId_roomId: { userId, roomId } },
          data: updateData,
        });
      }),

    leaveRoom: trpc.procedure
      .input(z.object({ userId: z.string(), roomId: z.number() }))
      .mutation(async ({ input }) => {
        const { userId, roomId } = input;

        try {
          const roomUser = await ctx.roomUserService.deleteRoomUser({
            userId_roomId: { userId, roomId },
          });

          // Pusher logic
          ctx.pusherService.trigger(getRoomChannelId(roomId), EVENT_ROOM_LEFT, {
            userId,
            roomId,
          });

          return {
            success: true,
            message: 'User successfully removed from the room',
            data: roomUser,
          };
        } catch (error: unknown) {
          // Type guard to check if the error is an instance of PrismaClientKnownRequestError
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Handle specific error if user is not in the room
            if (error.code === 'P2025') {
              // Prisma record not found error code
              return {
                success: false,
                message: 'User is not in the room',
              };
            }
          }

          // Handle other errors
          return {
            success: false,
            message: 'An unexpected error occurred',
            error: (error as Error).message, // Type assertion to access the message property
          };
        }
      }),
    //TODO: Middleware and/or logic so only room host can kick users
    //TODO: Middleware and/or logic so this action does nothing when game is started
    kickUser: trpc.procedure
      .input(z.object({ userId: z.string(), roomId: z.number() }))
      .mutation(async ({ input }) => {
        const { userId, roomId } = input;

        try {
          const roomUser = await ctx.roomUserService.deleteRoomUser({
            userId_roomId: { userId, roomId },
          });

          // Pusher logic
          ctx.pusherService.trigger(getRoomChannelId(roomId), EVENT_ROOM_KICK, {
            userId,
            roomId,
          });

          return {
            success: true,
            message: 'User successfully kicked from the room',
            data: roomUser,
          };
        } catch (error: unknown) {
          // Type guard to check if the error is an instance of PrismaClientKnownRequestError
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Handle specific error if user is not in the room
            if (error.code === 'P2025') {
              // Prisma record not found error code
              return {
                success: false,
                message: 'User is not in the room',
              };
            }
          }

          // Handle other errors
          return {
            success: false,
            message: 'An unexpected error occurred',
            error: (error as Error).message, // Type assertion to access the message property
          };
        }
      }),
  });
