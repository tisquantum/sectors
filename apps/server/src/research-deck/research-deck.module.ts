import { Module } from '@nestjs/common';
import { ResearchDeckService } from './research-deck.service';

@Module({
  providers: [ResearchDeckService],
  exports: [ResearchDeckService],
})
export class ResearchDeckModule {}
