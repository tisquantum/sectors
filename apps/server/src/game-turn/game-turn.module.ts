import { Module } from '@nestjs/common';
import { GameTurnService } from './game-turn.service';
import { GameTurnController } from './game-turn.controller';

@Module({
  controllers: [GameTurnController],
  providers: [GameTurnService],
})
export class GameTurnModule {}
