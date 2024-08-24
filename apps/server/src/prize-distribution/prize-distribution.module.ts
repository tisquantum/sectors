import { Module } from '@nestjs/common';
import { PrizeDistributionService } from './prize-distribution.service';

@Module({
  providers: [PrizeDistributionService],
  exports: [PrizeDistributionService],
})
export class PrizeDistributionModule {}
