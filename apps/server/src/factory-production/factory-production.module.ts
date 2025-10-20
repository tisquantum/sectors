import { Module } from '@nestjs/common';
import { FactoryProductionService } from './factory-production.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [FactoryProductionService],
  exports: [FactoryProductionService],
})
export class FactoryProductionModule {}

