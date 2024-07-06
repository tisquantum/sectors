import { Test, TestingModule } from '@nestjs/testing';
import { RevenueDistributionVoteService } from './revenue-distribution-vote.service';

describe('RevenueDistributionVoteService', () => {
  let service: RevenueDistributionVoteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RevenueDistributionVoteService],
    }).compile();

    service = module.get<RevenueDistributionVoteService>(RevenueDistributionVoteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
