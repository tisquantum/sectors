import { Test, TestingModule } from '@nestjs/testing';
import { PlayerPriorityService } from './player-priority.service';

describe('PlayerPriorityService', () => {
  let service: PlayerPriorityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlayerPriorityService],
    }).compile();

    service = module.get<PlayerPriorityService>(PlayerPriorityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
