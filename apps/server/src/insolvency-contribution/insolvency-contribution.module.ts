import { Module } from '@nestjs/common';
import { InsolvencyContributionService } from './insolvency-contribution.service';

@Module({
  providers: [InsolvencyContributionService],
  exports: [InsolvencyContributionService],
})
export class InsolvencyContributionModule {}
