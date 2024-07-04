import { Module } from '@nestjs/common';
import { OperatingRoundVoteService } from './operating-round-vote.service';

@Module({
  providers: [OperatingRoundVoteService],
  exports: [OperatingRoundVoteService],
})
export class OperatingRoundVoteModule {}
