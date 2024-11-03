import { Module } from '@nestjs/common';
import { CompanyAwardTrackService } from './company-award-track.service';
import { CompanyAwardTrackSpaceModule } from '@server/company-award-track-space/company-award-track-space.module';

@Module({
  imports: [CompanyAwardTrackSpaceModule],
  providers: [CompanyAwardTrackService],
  exports: [CompanyAwardTrackService],
})
export class CompanyAwardTrackModule {}
