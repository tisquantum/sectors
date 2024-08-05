import { Module } from '@nestjs/common';
import { PlayerResultService } from './player-result.service';

@Module({
  providers: [PlayerResultService],
  exports: [PlayerResultService],
})
export class PlayerResultModule {}
