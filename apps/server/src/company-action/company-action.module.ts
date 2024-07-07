import { Module } from '@nestjs/common';
import { CompanyActionService } from './company-action.service';

@Module({
  providers: [CompanyActionService],
  exports: [CompanyActionService],
})
export class CompanyActionModule {}
