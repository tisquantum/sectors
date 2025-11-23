import { Module } from '@nestjs/common';
import { ExecutiveCardService } from './executive-card.service';

@Module({
  providers: [ExecutiveCardService],
  exports: [ExecutiveCardService],
})
export class ExecutiveCardModule {}
