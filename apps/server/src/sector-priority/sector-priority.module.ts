import { Module } from '@nestjs/common';
import { SectorPriorityService } from './sector-priority.service';

@Module({
  providers: [SectorPriorityService],
  exports: [SectorPriorityService],
})
export class SectorPriorityModule {}
