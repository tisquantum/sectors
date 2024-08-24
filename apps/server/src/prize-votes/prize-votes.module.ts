import { Module } from '@nestjs/common';
import { PrizeVotesService } from './prize-votes.service';

@Module({
  providers: [PrizeVotesService],
  exports: [PrizeVotesService],
})
export class PrizeVotesModule {}
