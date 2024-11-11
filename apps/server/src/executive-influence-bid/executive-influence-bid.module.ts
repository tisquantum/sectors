import { Module } from '@nestjs/common';
import { ExecutiveInfluenceBidService } from './executive-influence-bid.service';

@Module({
  providers: [ExecutiveInfluenceBidService],
  exports: [ExecutiveInfluenceBidService],
})
export class ExecutiveInfluenceBidModule {}
