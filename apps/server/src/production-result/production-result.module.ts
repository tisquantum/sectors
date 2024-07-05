import { Module } from '@nestjs/common';
import { ProductionResultService } from './production-result.service';

@Module({
  providers: [ProductionResultService],
  exports: [ProductionResultService],
})
export class ProductionResultModule {}
