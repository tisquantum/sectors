import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { RoomUser, Prisma } from '@prisma/client';

@Injectable()
export class RoomUserService {
  constructor(private prisma: PrismaService) {}

  async roomUser(
    roomUserWhereUniqueInput: Prisma.RoomUserWhereUniqueInput,
  ): Promise<RoomUser | null> {
    return this.prisma.roomUser.findUnique({
      where: roomUserWhereUniqueInput,
    });
  }

  async roomUsers(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.RoomUserWhereUniqueInput;
    where?: Prisma.RoomUserWhereInput;
    orderBy?: Prisma.RoomUserOrderByWithRelationInput;
  }): Promise<RoomUser[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.roomUser.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createRoomUser(data: Prisma.RoomUserCreateInput): Promise<RoomUser> {
    return this.prisma.roomUser.create({
      data,
    });
  }

  async updateRoomUser(params: {
    where: Prisma.RoomUserWhereUniqueInput;
    data: Prisma.RoomUserUpdateInput;
  }): Promise<RoomUser> {
    const { where, data } = params;
    return this.prisma.roomUser.update({
      data,
      where,
    });
  }

  async deleteRoomUser(
    where: Prisma.RoomUserWhereUniqueInput,
  ): Promise<RoomUser> {
    return this.prisma.roomUser.delete({
      where,
    });
  }
}
