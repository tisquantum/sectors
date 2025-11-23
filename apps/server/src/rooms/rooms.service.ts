import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Room, Prisma, User, Game } from '@prisma/client';
import { PusherChannel, PusherEvent } from 'nestjs-pusher';
import {
  CHANNEL_ROOM_GLOBAL,
  EVENT_ROOM_CREATED,
} from '@server/pusher/pusher.types';
import { RoomWithUsersAndGames } from '@server/prisma/prisma.types';
import { GLOBAL_ROOM_ID } from '@server/data/constants';

@Injectable()
export class RoomService {
  constructor(private prisma: PrismaService) {}

  async room(
    roomWhereUniqueInput: Prisma.RoomWhereUniqueInput,
  ): Promise<RoomWithUsersAndGames | null> {
    return this.prisma.room.findUnique({
      where: {
        ...roomWhereUniqueInput,
        NOT: {
          id: parseFloat(GLOBAL_ROOM_ID),
        },
      },
      include: {
        game: true,
        executiveGame: true,
        users: {
          include: {
            user: true, // Assuming RoomUser has a relation to User
          },
        },
      },
    });
  }

  async rooms(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.RoomWhereUniqueInput;
    where?: Prisma.RoomWhereInput;
    orderBy?: Prisma.RoomOrderByWithRelationInput;
  }): Promise<RoomWithUsersAndGames[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.room.findMany({
      skip,
      take,
      cursor,
      where: {
        ...where,
        NOT: {
          id: parseFloat(GLOBAL_ROOM_ID),
        },
      },
      orderBy,
      include: {
        users: {
          include: {
            user: true, // Assuming RoomUser has a relation to User
          },
        },
        game: true,
        executiveGame: true,
      },
    });
  }

  @PusherChannel(CHANNEL_ROOM_GLOBAL)
  @PusherEvent(EVENT_ROOM_CREATED)
  async createRoom(data: Prisma.RoomCreateInput): Promise<Room> {
    return this.prisma.room.create({
      data,
    });
  }

  async updateRoom(params: {
    where: Prisma.RoomWhereUniqueInput;
    data: Prisma.RoomUpdateInput;
  }): Promise<Room> {
    const { where, data } = params;
    return this.prisma.room.update({
      data,
      where,
    });
  }

  async deleteRoom(where: Prisma.RoomWhereUniqueInput): Promise<Room> {
    return this.prisma.room.delete({
      where,
    });
  }
}
