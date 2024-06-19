import { Test, TestingModule } from '@nestjs/testing';
import { StockRoundService } from './stock-round.service';

describe('StockRoundService', () => {
  let service: StockRoundService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StockRoundService],
    }).compile();

    service = module.get<StockRoundService>(StockRoundService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
