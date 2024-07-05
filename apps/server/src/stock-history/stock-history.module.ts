import { Module } from '@nestjs/common';
import { StockHistoryService } from './stock-history.service';

@Module({
  providers: [StockHistoryService],
  exports: [StockHistoryService],
})
export class StockHistoryModule {}
