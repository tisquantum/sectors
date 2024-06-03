import { Module } from '@nestjs/common';
import { TrpcService } from '@server/trpc/trpc.service';
import { TrpcRouter } from '@server/trpc/trpc.router';
import { UsersService } from '@server/users/users.service';
import { RoomService } from '@server/rooms/rooms.service';
import { RoomMessageService } from '@server/room-messages/room-messages.service';
import { RoomUserService } from '@server/room-user/room-user.service';
import { PrismaModule } from '@server/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [
    TrpcService,
    TrpcRouter,
    UsersService,
    RoomService,
    RoomMessageService,
    RoomUserService,
  ],
})
export class TrpcModule {}
