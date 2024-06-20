import { Module } from '@nestjs/common';
import { StockRoundService } from './stock-round.service';

@Module({
  providers: [StockRoundService],
  exports: [StockRoundService],
})
export class StockRoundModule {}
