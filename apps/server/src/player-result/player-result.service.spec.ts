import { Test, TestingModule } from '@nestjs/testing';
import { PlayerResultService } from './player-result.service';

describe('PlayerResultService', () => {
  let service: PlayerResultService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlayerResultService],
    }).compile();

    service = module.get<PlayerResultService>(PlayerResultService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
