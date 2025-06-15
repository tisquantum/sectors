import { Module } from '@nestjs/common';
import { MarketingService } from './marketing.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [MarketingService, PrismaService],
  exports: [MarketingService],
})
export class MarketingModule {} 