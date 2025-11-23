import { Module } from '@nestjs/common';
import { ExecutiveInfluenceService } from './executive-influence.service';

@Module({
  providers: [ExecutiveInfluenceService],
  exports: [ExecutiveInfluenceService],
})
export class ExecutiveInfluenceModule {}
