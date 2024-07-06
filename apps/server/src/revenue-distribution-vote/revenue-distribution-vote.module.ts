import { Module } from '@nestjs/common';
import { RevenueDistributionVoteService } from './revenue-distribution-vote.service';

@Module({
  providers: [RevenueDistributionVoteService],
  exports: [RevenueDistributionVoteService],
})
export class RevenueDistributionVoteModule {}
