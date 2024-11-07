import { Test, TestingModule } from '@nestjs/testing';
import { ExecutiveInfluenceService } from './executive-influence.service';

describe('ExecutiveInfluenceService', () => {
  let service: ExecutiveInfluenceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExecutiveInfluenceService],
    }).compile();

    service = module.get<ExecutiveInfluenceService>(ExecutiveInfluenceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
