import { Module } from '@nestjs/common';
import { PrismaModule } from '@server/prisma/prisma.module';
import { PlayersModule } from '@server/players/players.module';
import { GamePlayerModule } from '../game-player/game-player.module';
import { GameManagementService } from './game-management.service';
import { GamesModule } from '@server/games/games.module';
import { CompanyModule } from '@server/company/company.module';
import { SectorModule } from '@server/sector/sector.module';
import { GameCompanyModule } from '@server/game-company/game-company.module';

@Module({
  imports: [
    PrismaModule,
    PlayersModule,
    GamePlayerModule,
    GamesModule,
    CompanyModule,
    SectorModule,
    GameCompanyModule,
  ],
  providers: [GameManagementService],
  exports: [GameManagementService],
})
export class GameManagementModule {}
