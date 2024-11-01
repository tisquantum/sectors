import { Module } from '@nestjs/common';
import { StockSubRoundService } from './stock-sub-round.service';

@Module({
  providers: [StockSubRoundService],
  exports: [StockSubRoundService],
})
export class StockSubRoundModule {}
