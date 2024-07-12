import { Module } from '@nestjs/common';
import { CapitalGainsService } from './capital-gains.service';

@Module({
  providers: [CapitalGainsService],
  exports: [CapitalGainsService],
})
export class CapitalGainsModule {}
