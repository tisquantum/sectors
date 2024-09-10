import { Test, TestingModule } from '@nestjs/testing';
import { SectorPriorityService } from './sector-priority.service';

describe('SectorPriorityService', () => {
  let service: SectorPriorityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SectorPriorityService],
    }).compile();

    service = module.get<SectorPriorityService>(SectorPriorityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
