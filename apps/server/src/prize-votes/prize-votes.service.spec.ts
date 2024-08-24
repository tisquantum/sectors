import { Test, TestingModule } from '@nestjs/testing';
import { PrizeVotesService } from './prize-votes.service';

describe('PrizeVotesService', () => {
  let service: PrizeVotesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrizeVotesService],
    }).compile();

    service = module.get<PrizeVotesService>(PrizeVotesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
