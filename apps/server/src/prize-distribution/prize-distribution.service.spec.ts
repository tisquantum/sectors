import { Test, TestingModule } from '@nestjs/testing';
import { PrizeDistributionService } from './prize-distribution.service';

describe('PrizeDistributionService', () => {
  let service: PrizeDistributionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrizeDistributionService],
    }).compile();

    service = module.get<PrizeDistributionService>(PrizeDistributionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
