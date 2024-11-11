import { Test, TestingModule } from '@nestjs/testing';
import { ExecutiveCardService } from './executive-card.service';

describe('ExecutiveCardService', () => {
  let service: ExecutiveCardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExecutiveCardService],
    }).compile();

    service = module.get<ExecutiveCardService>(ExecutiveCardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
