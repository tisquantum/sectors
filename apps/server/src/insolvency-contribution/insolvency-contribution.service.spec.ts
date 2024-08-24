import { Test, TestingModule } from '@nestjs/testing';
import { InsolvencyContributionService } from './insolvency-contribution.service';

describe('InsolvencyContributionService', () => {
  let service: InsolvencyContributionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InsolvencyContributionService],
    }).compile();

    service = module.get<InsolvencyContributionService>(InsolvencyContributionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
