import { Module } from '@nestjs/common';
import { PrizeService } from './prize.service';

@Module({
  providers: [PrizeService],
  exports: [PrizeService],
})
export class PrizeModule {}
