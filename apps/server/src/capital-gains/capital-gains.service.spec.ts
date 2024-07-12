import { Test, TestingModule } from '@nestjs/testing';
import { CapitalGainsService } from './capital-gains.service';

describe('CapitalGainsService', () => {
  let service: CapitalGainsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CapitalGainsService],
    }).compile();

    service = module.get<CapitalGainsService>(CapitalGainsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
