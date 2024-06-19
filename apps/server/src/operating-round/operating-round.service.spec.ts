import { Test, TestingModule } from '@nestjs/testing';
import { OperatingRoundService } from './operating-round.service';

describe('OperatingRoundService', () => {
  let service: OperatingRoundService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OperatingRoundService],
    }).compile();

    service = module.get<OperatingRoundService>(OperatingRoundService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
