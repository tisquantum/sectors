import { Module } from '@nestjs/common';
import { RoomMessageService } from './room-messages.service';
import { PrismaModule } from '@server/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [RoomMessageService],
})
export class RoomMessagesModule {}
