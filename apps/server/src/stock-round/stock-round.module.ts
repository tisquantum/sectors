import { Module } from '@nestjs/common';
import { StockRoundService } from './stock-round.service';
import { StockSubRoundModule } from '@server/stock-sub-round/stock-sub-round.module';

@Module({
  imports: [StockSubRoundModule],
  providers: [StockRoundService],
  exports: [StockRoundService],
})
export class StockRoundModule {}
