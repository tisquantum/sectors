import { Module } from '@nestjs/common';
import { InfluenceRoundVotesService } from './influence-round-votes.service';

@Module({
  providers: [InfluenceRoundVotesService],
  exports: [InfluenceRoundVotesService],
})
export class InfluenceRoundVotesModule {}
