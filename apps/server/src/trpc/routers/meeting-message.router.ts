import { z } from 'zod';
import { MeetingMessageService } from '@server/meeting-message/meeting-message.service';
import { TrpcService } from '../trpc.service';
import { Prisma } from '@prisma/client';
import { PusherService } from 'nestjs-pusher';
import {
  EVENT_MEETING_MESSAGE_CREATED,
  getGameChannelId,
} from '@server/pusher/pusher.types';

type Context = {
  meetingMessageService: MeetingMessageService;
  pusherService: PusherService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getMessage: trpc.procedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { id } = input;
        const message = await ctx.meetingMessageService.getMessage({ id });
        if (!message) {
          throw new Error('Message not found');
        }
        return message;
      }),

    listMessages: trpc.procedure
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
        return ctx.meetingMessageService.getMessages({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),
  });
