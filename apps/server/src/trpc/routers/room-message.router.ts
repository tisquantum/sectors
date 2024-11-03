import { z } from 'zod';
import { RoomMessageService } from '@server/room-messages/room-messages.service';
import { TrpcService } from '../trpc.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PusherService } from 'nestjs-pusher';
import {
  EVENT_ROOM_MESSAGE,
  getRoomChannelId,
} from '@server/pusher/pusher.types';
import { RoomMessageWithRoomUser } from '@server/prisma/prisma.types';
import { checkIsUserAction } from '../trpc.middleware';
import { ROOM_MESSAGE_MAX_LENGTH } from '@server/data/constants';
import { TRPCError } from '@trpc/server';

type Context = {
  roomMessageService: RoomMessageService;
  pusherService: PusherService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getRoomMessage: trpc.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { id } = input;
        const roomMessage = await ctx.roomMessageService.roomMessage({ id });
        if (!roomMessage) {
          throw new Error('RoomMessage not found');
        }
        return roomMessage;
      }),

    listRoomMessages: trpc.procedure
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
        return ctx.roomMessageService.roomMessages({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    createRoomMessage: trpc.procedure
      .input(
        z.object({
          roomId: z.number(),
          userId: z.string(),
          content: z.string(),
          timestamp: z.string(),
        }),
      )
      .use(checkIsUserAction)
      .mutation(async ({ input }) => {
        const { roomId, userId, content, timestamp } = input;
        if (!content) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Content is required',
          });
        }
        if (content.length > ROOM_MESSAGE_MAX_LENGTH) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Content must be less than ${ROOM_MESSAGE_MAX_LENGTH} characters`,
          });
        }
        try {
          const roomMessage = await ctx.roomMessageService.createRoomMessage({
            content,
            timestamp,
            room: {
              connect: { id: roomId },
            },
            roomUser: {
              connect: {
                userId_roomId: {
                  userId: userId,
                  roomId: roomId,
                },
              },
            },
          });

          //pusher logic
          ctx.pusherService
            .trigger(getRoomChannelId(roomId), EVENT_ROOM_MESSAGE, roomMessage)
            .catch((error) => {
              console.error('Error triggering pusher event:', error);
            });

          return {
            success: true,
            message: 'Message successfully sent to the room',
            data: roomMessage,
          };
        } catch (error) {
          if (
            error instanceof PrismaClientKnownRequestError &&
            error.code === 'P2025'
          ) {
            return {
              success: false,
              message: 'The room does not exist',
            };
          }

          return {
            success: false,
            message: 'An unexpected error occurred',
          };
        }
      }),

    updateRoomMessage: trpc.procedure
      .input(
        z.object({
          id: z.string(),
          data: z.object({
            content: z.string().optional(),
            timestamp: z.string(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, data } = input;
        return ctx.roomMessageService.updateRoomMessage({
          where: { id },
          data,
        });
      }),

    deleteRoomMessage: trpc.procedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const { id } = input;
        return ctx.roomMessageService.deleteRoomMessage({ id });
      }),
  });
