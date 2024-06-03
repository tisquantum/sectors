import { Module } from '@nestjs/common';
import { RoomService } from './rooms.service';
import { PrismaModule } from '@server/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [RoomService],
})
export class RoomsModule {}
