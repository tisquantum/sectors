import { Module } from '@nestjs/common';
import { PrismaModule } from '@server/prisma/prisma.module';
import { PlayersModule } from '@server/players/players.module';
import { GamePlayerModule } from '../game-player/game-player.module';
import { GameManagementService } from './game-management.service';
import { GamesService } from '@server/games/games.service';

@Module({
  imports: [PrismaModule, PlayersModule, GamePlayerModule, GamesService],
  providers: [GameManagementService],
  exports: [GameManagementService],
})
export class GameManagementModule {}
