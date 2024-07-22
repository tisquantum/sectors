import { Module } from '@nestjs/common';
import { ShortOrderService } from './short-order.service';

@Module({
  providers: [ShortOrderService],
  exports: [ShortOrderService],
})
export class ShortOrderModule {}
