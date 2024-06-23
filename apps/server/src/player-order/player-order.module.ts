import { Module } from '@nestjs/common';
import { PlayerOrderService } from './player-order.service';

@Module({
  providers: [PlayerOrderService],
  exports: [PlayerOrderService],
})
export class PlayerOrderModule {}
