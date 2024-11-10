import { Module } from '@nestjs/common';
import { ExecutiveInfluenceVoteRoundService } from './executive-influence-vote-round.service';

@Module({
  providers: [ExecutiveInfluenceVoteRoundService],
  exports: [ExecutiveInfluenceVoteRoundService],
})
export class ExecutiveInfluenceVoteRoundModule {}
