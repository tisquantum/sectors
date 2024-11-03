import { Module } from '@nestjs/common';
import { CompanyAwardTrackSpaceService } from './company-award-track-space.service';

@Module({
  providers: [CompanyAwardTrackSpaceService],
  exports: [CompanyAwardTrackSpaceService],
})
export class CompanyAwardTrackSpaceModule {}
