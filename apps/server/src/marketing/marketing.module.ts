import { Module } from '@nestjs/common';
import { MarketingService } from './marketing.service';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [TransactionModule],
  providers: [MarketingService, PrismaService],
  exports: [MarketingService],
})
export class MarketingModule {} 