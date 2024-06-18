import { z } from 'zod';
import { MeetingMessageService } from '@server/meeting-message/meeting-message.service';
import { TrpcService } from '../trpc.service';
import { Prisma } from '@prisma/client';
import { PusherService } from 'nestjs-pusher';
import { EVENT_MEETING_MESSAGE_CREATED, getGameChannelId } from '@server/pusher/pusher.types';

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

    createMessage: trpc.procedure
      .input(
        z.object({
          gameId: z.string(),
          playerId: z.string(),
          content: z.string(),
          gameStep: z.number(),
          timestamp: z.string(),
          createdAt: z.date().optional(),
          updatedAt: z.date().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { gameId, playerId, ...rest } = input;
        const data: Prisma.MeetingMessageCreateInput = {
          game: { connect: { id: gameId } },
          player: { connect: { id: playerId } },
          ...rest,
        };
        const message = await ctx.meetingMessageService.createMessage(data);
        ctx.pusherService.trigger(getGameChannelId(gameId), EVENT_MEETING_MESSAGE_CREATED, message);
        return message;
      }),

    createManyMessages: trpc.procedure
      .input(z.array(
        z.object({
          gameId: z.string(),
          playerId: z.string(),
          content: z.string(),
          gameStep: z.number(),
          timestamp: z.string(),
          createdAt: z.date(),
          updatedAt: z.date(),
        }),
      ))
      .mutation(async ({ input }) => {
        const data: Prisma.MeetingMessageCreateManyInput[] = input.map((item) => ({
          gameId: item.gameId,
          playerId: item.playerId,
          content: item.content,
          gameStep: item.gameStep,
          timestamp: item.timestamp,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }));
        return ctx.meetingMessageService.createManyMessages(data);
      }),

    updateMessage: trpc.procedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            gameId: z.string().optional(),
            playerId: z.string().optional(),
            content: z.string().optional(),
            gameStep: z.number().optional(),
            timestamp: z.string().optional(),
            createdAt: z.date().optional(),
            updatedAt: z.date().optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, data } = input;
        const updateData: Prisma.MeetingMessageUpdateInput = {
          ...data,
          game: data.gameId ? { connect: { id: data.gameId } } : undefined,
          player: data.playerId ? { connect: { id: data.playerId } } : undefined,
        };
        return ctx.meetingMessageService.updateMessage({ where: { id }, data: updateData });
      }),

    deleteMessage: trpc.procedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { id } = input;
        return ctx.meetingMessageService.deleteMessage({ id });
      }),
  });
