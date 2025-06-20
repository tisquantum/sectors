import { Module } from '@nestjs/common';
import { FactoryConstructionService } from './factory-construction.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GameManagementModule } from '../game-management/game-management.module';

@Module({
  imports: [PrismaModule, GameManagementModule],
  providers: [FactoryConstructionService],
  exports: [FactoryConstructionService],
})
export class FactoryConstructionModule {} 