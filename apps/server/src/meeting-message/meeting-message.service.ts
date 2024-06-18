import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, MeetingMessage } from '@prisma/client';
import { MeetingMessageWithPlayer } from '@server/prisma/prisma.types';

@Injectable()
export class MeetingMessageService {
  constructor(private prisma: PrismaService) {}

  async getMessage(
    meetingMessageWhereUniqueInput: Prisma.MeetingMessageWhereUniqueInput,
  ): Promise<MeetingMessage | null> {
    return this.prisma.meetingMessage.findUnique({
      where: meetingMessageWhereUniqueInput,
    });
  }

  async getMessages(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.MeetingMessageWhereUniqueInput;
    where?: Prisma.MeetingMessageWhereInput;
    orderBy?: Prisma.MeetingMessageOrderByWithRelationInput;
  }): Promise<MeetingMessageWithPlayer[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.meetingMessage.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        player: true,
      },
    });
  }

  async createMessage(data: Prisma.MeetingMessageCreateInput): Promise<MeetingMessageWithPlayer> {
    return this.prisma.meetingMessage.create({
      data,
      include: {
        player: true,
      },
    });
  }

  async createManyMessages(data: Prisma.MeetingMessageCreateManyInput[]): Promise<MeetingMessage[]> {
    return this.prisma.meetingMessage.createManyAndReturn({
      data,
      skipDuplicates: true,
    });
  }

  async updateMessage(params: {
    where: Prisma.MeetingMessageWhereUniqueInput;
    data: Prisma.MeetingMessageUpdateInput;
  }): Promise<MeetingMessage> {
    const { where, data } = params;
    return this.prisma.meetingMessage.update({
      data,
      where,
    });
  }

  async deleteMessage(where: Prisma.MeetingMessageWhereUniqueInput): Promise<MeetingMessage> {
    return this.prisma.meetingMessage.delete({
      where,
    });
  }
}
