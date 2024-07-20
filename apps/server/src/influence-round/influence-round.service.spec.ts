import { Test, TestingModule } from '@nestjs/testing';
import { InfluenceRoundService } from './influence-round.service';

describe('InfluenceRoundService', () => {
  let service: InfluenceRoundService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InfluenceRoundService],
    }).compile();

    service = module.get<InfluenceRoundService>(InfluenceRoundService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
