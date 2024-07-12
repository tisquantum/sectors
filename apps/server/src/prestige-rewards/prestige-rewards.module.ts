import { Module } from '@nestjs/common';
import { PrestigeRewardsService } from './prestige-rewards.service';

@Module({
  providers: [PrestigeRewardsService],
  exports: [PrestigeRewardsService],
})
export class PrestigeRewardsModule {}
