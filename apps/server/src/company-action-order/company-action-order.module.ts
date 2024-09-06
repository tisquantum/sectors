import { Module } from '@nestjs/common';
import { CompanyActionOrderService } from './company-action-order.service';

@Module({
  providers: [CompanyActionOrderService],
  exports: [CompanyActionOrderService],
})
export class CompanyActionOrderModule {}
