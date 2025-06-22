import { Module } from '@nestjs/common';
import { FactoryConstructionService } from './factory-construction.service';
import { FactoryConstructionOrderService } from './factory-construction-order.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GameManagementModule } from '../game-management/game-management.module';

@Module({
  imports: [PrismaModule, GameManagementModule],
  providers: [FactoryConstructionService, FactoryConstructionOrderService],
  exports: [FactoryConstructionService, FactoryConstructionOrderService],
})
export class FactoryConstructionModule {} 