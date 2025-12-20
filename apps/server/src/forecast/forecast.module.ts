import { Module } from '@nestjs/common';
import { ForecastService } from './forecast.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GameLogModule } from '../game-log/game-log.module';
import { SectorModule } from '../sector/sector.module';
import { ShareModule } from '../share/share.module';

@Module({
  imports: [PrismaModule, GameLogModule, SectorModule, ShareModule],
  providers: [ForecastService],
  exports: [ForecastService],
})
export class ForecastModule {}
