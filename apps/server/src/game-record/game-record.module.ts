import { Module } from '@nestjs/common';
import { GameRecordService } from './game-record.service';

@Module({
  providers: [GameRecordService],
  exports: [GameRecordService],
})
export class GameRecordModule {}
