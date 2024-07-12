import { Test, TestingModule } from '@nestjs/testing';
import { GameTurnService } from './game-turn.service';

describe('GameTurnService', () => {
  let service: GameTurnService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameTurnService],
    }).compile();

    service = module.get<GameTurnService>(GameTurnService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
