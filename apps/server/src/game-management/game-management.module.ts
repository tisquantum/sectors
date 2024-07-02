import { Module } from '@nestjs/common';
import { PrismaModule } from '@server/prisma/prisma.module';
import { PlayersModule } from '@server/players/players.module';
import { GameManagementService } from './game-management.service';
import { GamesModule } from '@server/games/games.module';
import { CompanyModule } from '@server/company/company.module';
import { SectorModule } from '@server/sector/sector.module';
import { StockRoundModule } from '@server/stock-round/stock-round.module';
import { PhaseModule } from '@server/phase/phase.module';
import { TimerModule } from '@server/timer/timer.module';
import { PusherModule } from 'nestjs-pusher';
import { OperatingRoundModule } from '@server/operating-round/operating-round.module';
import { ShareModule } from '@server/share/share.module';
import { PlayerOrderModule } from '@server/player-order/player-order.module';

@Module({
  imports: [
    PrismaModule,
    PlayersModule,
    GamesModule,
    CompanyModule,
    SectorModule,
    StockRoundModule,
    PhaseModule,
    TimerModule,
    PusherModule,
    OperatingRoundModule,
    ShareModule,
    PlayerOrderModule,
  ],
  providers: [GameManagementService],
  exports: [GameManagementService],
})
export class GameManagementModule {}
