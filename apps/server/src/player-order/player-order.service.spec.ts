import { Test, TestingModule } from '@nestjs/testing';
import { PlayerOrderService } from './player-order.service';

describe('PlayerOrderService', () => {
  let service: PlayerOrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlayerOrderService],
    }).compile();

    service = module.get<PlayerOrderService>(PlayerOrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
