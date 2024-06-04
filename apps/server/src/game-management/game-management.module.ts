import { Module } from '@nestjs/common';
import { PrismaModule } from '@server/prisma/prisma.module';
import { PlayersModule } from '@server/players/players.module';
import { GamePlayerModule } from '../game-player/game-player.module';
import { GameManagementService } from './game-management.service';

@Module({
  imports: [PrismaModule, PlayersModule, GamePlayerModule],
  providers: [GameManagementService],
  exports: [GameManagementService],
})
export class GameManagementModule {}
