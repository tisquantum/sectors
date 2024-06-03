import { Module } from '@nestjs/common';
import { RoomUserService } from './room-user.service';
import { PrismaModule } from '@server/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [RoomUserService],
})
export class RoomUserModule {}
