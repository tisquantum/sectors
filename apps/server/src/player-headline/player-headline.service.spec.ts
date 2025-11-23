import { Test, TestingModule } from '@nestjs/testing';
import { PlayerHeadlineService } from './player-headline.service';

describe('PlayerHeadlineService', () => {
  let service: PlayerHeadlineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlayerHeadlineService],
    }).compile();

    service = module.get<PlayerHeadlineService>(PlayerHeadlineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
