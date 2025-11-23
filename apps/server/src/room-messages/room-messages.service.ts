import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { RoomMessage, Prisma, User, RoomUser } from '@prisma/client';
import { ROOM_MESSAGE_MAX_LENGTH } from '@server/data/constants';
import {
  RoomUserWithRelations,
  RoomUserWithUserAndPlayer,
} from '@server/prisma/prisma.types';

@Injectable()
export class RoomMessageService {
  constructor(private prisma: PrismaService) {}

  async roomMessage(
    roomMessageWhereUniqueInput: Prisma.RoomMessageWhereUniqueInput,
  ): Promise<(RoomMessage & { roomUser: RoomUserWithUserAndPlayer }) | null> {
    return this.prisma.roomMessage.findUnique({
      where: roomMessageWhereUniqueInput,
      include: {
        roomUser: {
          include: {
            user: true,
            player: true,
          },
        },
      },
    });
  }

  async roomMessages(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.RoomMessageWhereUniqueInput;
    where?: Prisma.RoomMessageWhereInput;
    orderBy?: Prisma.RoomMessageOrderByWithRelationInput;
  }): Promise<(RoomMessage & { roomUser: RoomUserWithUserAndPlayer })[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.roomMessage.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        roomUser: {
          include: {
            user: true,
            player: true,
          },
        },
      },
    });
  }

  async createRoomMessage(
    data: Prisma.RoomMessageCreateInput,
  ): Promise<RoomMessage & { roomUser: RoomUserWithUserAndPlayer }> {
    if (data.content.length > ROOM_MESSAGE_MAX_LENGTH) {
      throw new Error('Content too long');
    }
    return this.prisma.roomMessage.create({
      data,
      include: {
        roomUser: {
          include: {
            user: true,
            player: true,
          },
        },
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
