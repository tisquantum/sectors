import { Test, TestingModule } from '@nestjs/testing';
import { ExecutiveGameTurnService } from './executive-game-turn.service';

describe('ExecutiveGameTurnService', () => {
  let service: ExecutiveGameTurnService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExecutiveGameTurnService],
    }).compile();

    service = module.get<ExecutiveGameTurnService>(ExecutiveGameTurnService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
