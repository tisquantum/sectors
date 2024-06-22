import { Module } from '@nestjs/common';
import { OperatingRoundService } from './operating-round.service';

@Module({
  providers: [OperatingRoundService],
  exports: [OperatingRoundService],
})
export class OperatingRoundModule {}
