import { Module } from '@nestjs/common';
import { PrismaModule } from '@server/prisma/prisma.module';
import { PlayersModule } from '@server/players/players.module';
import { GameManagementService } from './game-management.service';
import { GamesModule } from '@server/games/games.module';
import { CompanyModule } from '@server/company/company.module';
import { SectorModule } from '@server/sector/sector.module';

@Module({
  imports: [
    PrismaModule,
    PlayersModule,
    GamesModule,
    CompanyModule,
    SectorModule,
  ],
  providers: [GameManagementService],
  exports: [GameManagementService],
})
export class GameManagementModule {}
