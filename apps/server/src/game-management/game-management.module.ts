import { Module } from '@nestjs/common';
import { PrismaModule } from '@server/prisma/prisma.module';
import { PlayersModule } from '@server/players/players.module';
import { GameManagementService } from './game-management.service';
import { GamesModule } from '@server/games/games.module';
import { CompanyModule } from '@server/company/company.module';
import { SectorModule } from '@server/sector/sector.module';
import { StockRoundModule } from '@server/stock-round/stock-round.module';
import { PhaseModule } from '@server/phase/phase.module';

@Module({
  imports: [
    PrismaModule,
    PlayersModule,
    GamesModule,
    CompanyModule,
    SectorModule,
    StockRoundModule,
    PhaseModule,
  ],
  providers: [GameManagementService],
  exports: [GameManagementService],
})
export class GameManagementModule {}
