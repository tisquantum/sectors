import { Module } from '@nestjs/common';
import { ConsumptionMarkerService } from './consumption-marker.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ConsumptionMarkerService],
  exports: [ConsumptionMarkerService],
})
export class ConsumptionMarkerModule {}

