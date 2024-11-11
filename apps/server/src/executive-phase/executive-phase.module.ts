import { Module } from '@nestjs/common';
import { ExecutivePhaseService } from './executive-phase.service';

@Module({
  providers: [ExecutivePhaseService],
  exports: [ExecutivePhaseService],
})
export class ExecutivePhaseModule {}
