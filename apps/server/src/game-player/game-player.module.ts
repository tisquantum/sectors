import { Module } from '@nestjs/common';
import { GamePlayerService } from './game-player.service';
import { PrismaModule } from '@server/prisma/prisma.module';
import { PlayersModule } from '@server/players/players.module';

@Module({
  imports: [PrismaModule, PlayersModule],
  providers: [GamePlayerService],
})
export class GamePlayerModule {}
