import { Module } from '@nestjs/common';
import { ExecutivePlayerService } from './executive-player.service';

@Module({
  providers: [ExecutivePlayerService],
  exports: [ExecutivePlayerService],
})
export class ExecutivePlayerModule {}
