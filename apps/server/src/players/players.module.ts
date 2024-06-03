import { Module } from '@nestjs/common';
import { PlayersService } from './players.service';
import { PrismaModule } from '@server/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PlayersService],
})
export class PlayersModule {}
