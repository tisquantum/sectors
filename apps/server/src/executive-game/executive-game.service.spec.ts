import { Test, TestingModule } from '@nestjs/testing';
import { ExecutiveGameService } from './executive-game.service';

describe('ExecutiveGameService', () => {
  let service: ExecutiveGameService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExecutiveGameService],
    }).compile();

    service = module.get<ExecutiveGameService>(ExecutiveGameService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
