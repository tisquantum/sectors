import { Module } from '@nestjs/common';
import { PhaseService } from './phase.service';
import { TimerModule } from '@server/timer/timer.module';

@Module({
  providers: [PhaseService],
  exports: [PhaseService],
})
export class PhaseModule {}
