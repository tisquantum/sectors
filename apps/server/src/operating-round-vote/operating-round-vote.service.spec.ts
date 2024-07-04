import { Test, TestingModule } from '@nestjs/testing';
import { OperatingRoundVoteService } from './operating-round-vote.service';

describe('OperatingRoundVoteService', () => {
  let service: OperatingRoundVoteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OperatingRoundVoteService],
    }).compile();

    service = module.get<OperatingRoundVoteService>(OperatingRoundVoteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
