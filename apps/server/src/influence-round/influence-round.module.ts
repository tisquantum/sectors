import { Module } from '@nestjs/common';
import { InfluenceRoundService } from './influence-round.service';

@Module({
  providers: [InfluenceRoundService],
  exports: [InfluenceRoundService],
})
export class InfluenceRoundModule {}
