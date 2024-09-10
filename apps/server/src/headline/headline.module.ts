import { Module } from '@nestjs/common';
import { HeadlineService } from './headline.service';

@Module({
  providers: [HeadlineService],
  exports: [HeadlineService],
})
export class HeadlineModule {}
