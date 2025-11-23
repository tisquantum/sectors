import { Module } from '@nestjs/common';
import { ExecutiveGameTurnService } from './executive-game-turn.service';

@Module({
  providers: [ExecutiveGameTurnService],
  exports: [ExecutiveGameTurnService],
})
export class ExecutiveGameTurnModule {}
