import { Module } from '@nestjs/common';
import { MeetingMessageService } from './meeting-message.service';

@Module({
  providers: [MeetingMessageService],
  exports: [MeetingMessageService],
})
export class MeetingMessageModule {}
