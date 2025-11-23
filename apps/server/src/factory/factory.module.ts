import { Module } from '@nestjs/common';
import { FactoryService } from './factory.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [FactoryService, PrismaService],
  exports: [FactoryService],
})
export class FactoryModule {} 