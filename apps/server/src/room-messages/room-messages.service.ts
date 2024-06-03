import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { RoomMessage, Prisma } from '@prisma/client';

@Injectable()
export class RoomMessageService {
  constructor(private prisma: PrismaService) {}

  async roomMessage(
    roomMessageWhereUniqueInput: Prisma.RoomMessageWhereUniqueInput,
  ): Promise<RoomMessage | null> {
    return this.prisma.roomMessage.findUnique({
      where: roomMessageWhereUniqueInput,
    });
  }

  async roomMessages(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.RoomMessageWhereUniqueInput;
    where?: Prisma.RoomMessageWhereInput;
    orderBy?: Prisma.RoomMessageOrderByWithRelationInput;
  }): Promise<RoomMessage[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.roomMessage.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createRoomMessage(
    data: Prisma.RoomMessageCreateInput,
  ): Promise<RoomMessage> {
    return this.prisma.roomMessage.create({
      data,
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
