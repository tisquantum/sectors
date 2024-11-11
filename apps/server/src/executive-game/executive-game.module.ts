import { Module } from '@nestjs/common';
import { ExecutiveGameService } from './executive-game.service';

@Module({
  providers: [ExecutiveGameService],
  exports: [ExecutiveGameService],
})
export class ExecutiveGameModule {}
