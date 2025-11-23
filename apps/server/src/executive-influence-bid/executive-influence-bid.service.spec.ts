import { Test, TestingModule } from '@nestjs/testing';
import { ExecutiveInfluenceBidService } from './executive-influence-bid.service';

describe('ExecutiveInfluenceBidService', () => {
  let service: ExecutiveInfluenceBidService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExecutiveInfluenceBidService],
    }).compile();

    service = module.get<ExecutiveInfluenceBidService>(ExecutiveInfluenceBidService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
