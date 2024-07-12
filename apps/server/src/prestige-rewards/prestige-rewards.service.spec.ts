import { Test, TestingModule } from '@nestjs/testing';
import { PrestigeRewardsService } from './prestige-rewards.service';

describe('PrestigeRewardsService', () => {
  let service: PrestigeRewardsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrestigeRewardsService],
    }).compile();

    service = module.get<PrestigeRewardsService>(PrestigeRewardsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
