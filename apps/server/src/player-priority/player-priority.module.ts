import { Module } from '@nestjs/common';
import { PlayerPriorityService } from './player-priority.service';

@Module({
  providers: [PlayerPriorityService],
  exports: [PlayerPriorityService],
})
export class PlayerPriorityModule {}
