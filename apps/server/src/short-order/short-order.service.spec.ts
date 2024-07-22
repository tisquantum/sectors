import { Test, TestingModule } from '@nestjs/testing';
import { ShortOrderService } from './short-order.service';

describe('ShortOrderService', () => {
  let service: ShortOrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShortOrderService],
    }).compile();

    service = module.get<ShortOrderService>(ShortOrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
