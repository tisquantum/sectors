import { Module } from '@nestjs/common';
import { FactoryConstructionService } from './factory-construction.service';
import { FactoryConstructionOrderService } from './factory-construction-order.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PhaseModule } from '@server/phase/phase.module';

@Module({
  imports: [PrismaModule, PhaseModule],
  providers: [FactoryConstructionService, FactoryConstructionOrderService],
  exports: [FactoryConstructionService, FactoryConstructionOrderService],
})
export class FactoryConstructionModule {} 