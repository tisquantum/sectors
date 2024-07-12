import { Module } from '@nestjs/common';
import { GameTurnService } from './game-turn.service';

@Module({
  providers: [GameTurnService],
  exports: [GameTurnService],
})
export class GameTurnModule {}
