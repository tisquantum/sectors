import { Global, Module } from '@nestjs/common';
import { GameLogService } from './game-log.service';

@Global()
@Module({
  providers: [GameLogService],
  exports: [GameLogService],
})
export class GameLogModule {}
