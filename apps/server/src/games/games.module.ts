import { Module } from '@nestjs/common';
import { GamesService } from './games.service';
import { PrismaModule } from '@server/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [GamesService],
})
export class GamesModule {}
