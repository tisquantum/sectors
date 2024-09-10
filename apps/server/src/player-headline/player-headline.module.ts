import { Module } from '@nestjs/common';
import { PlayerHeadlineService } from './player-headline.service';

@Module({
  providers: [PlayerHeadlineService],
  exports: [PlayerHeadlineService],
})
export class PlayerHeadlineModule {}
