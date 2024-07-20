import { Test, TestingModule } from '@nestjs/testing';
import { InfluenceRoundVotesService } from './influence-round-votes.service';

describe('InfluenceRoundVotesService', () => {
  let service: InfluenceRoundVotesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InfluenceRoundVotesService],
    }).compile();

    service = module.get<InfluenceRoundVotesService>(InfluenceRoundVotesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
