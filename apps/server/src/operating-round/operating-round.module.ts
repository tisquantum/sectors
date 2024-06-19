import { Module } from '@nestjs/common';
import { OperatingRoundService } from './operating-round.service';

@Module({
  providers: [OperatingRoundService],
})
export class OperatingRoundModule {}
