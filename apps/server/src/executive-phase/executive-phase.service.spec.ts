import { Test, TestingModule } from '@nestjs/testing';
import { ExecutivePhaseService } from './executive-phase.service';

describe('ExecutivePhaseService', () => {
  let service: ExecutivePhaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExecutivePhaseService],
    }).compile();

    service = module.get<ExecutivePhaseService>(ExecutivePhaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
