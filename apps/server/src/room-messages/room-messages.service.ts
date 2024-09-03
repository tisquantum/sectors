import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { RoomMessage, Prisma, User } from '@prisma/client';
import { ROOM_MESSAGE_MAX_LENGTH } from '@server/data/constants';

@Injectable()
export class RoomMessageService {
  constructor(private prisma: PrismaService) {}

  async roomMessage(
    roomMessageWhereUniqueInput: Prisma.RoomMessageWhereUniqueInput,
  ): Promise<(RoomMessage & { user: User }) | null> {
    return this.prisma.roomMessage.findUnique({
      where: roomMessageWhereUniqueInput,
      include: {
        user: true,
      },
    });
  }

  async roomMessages(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.RoomMessageWhereUniqueInput;
    where?: Prisma.RoomMessageWhereInput;
    orderBy?: Prisma.RoomMessageOrderByWithRelationInput;
  }): Promise<(RoomMessage & { user: User })[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.roomMessage.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        user: true,
      },
    });
  }

  async createRoomMessage(
    data: Prisma.RoomMessageCreateInput,
  ): Promise<RoomMessage & { user: User }> {
    if (data.content.length > ROOM_MESSAGE_MAX_LENGTH) {
      throw new Error('Content too long');
    }
    return this.prisma.roomMessage.create({
      data,
      include: {
        user: true,
      },
    });
  }

  async updateRoomMessage(params: {
    where: Prisma.RoomMessageWhereUniqueInput;
    data: Prisma.RoomMessageUpdateInput;
  }): Promise<RoomMessage> {
    const { where, data } = params;
    return this.prisma.roomMessage.update({
      data,
      where,
    });
  }

  async deleteRoomMessage(
    where: Prisma.RoomMessageWhereUniqueInput,
  ): Promise<RoomMessage> {
    return this.prisma.roomMessage.delete({
      where,
    });
  }
}
