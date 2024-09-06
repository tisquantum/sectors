import { Test, TestingModule } from '@nestjs/testing';
import { CompanyActionOrderService } from './company-action-order.service';

describe('CompanyActionOrderService', () => {
  let service: CompanyActionOrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompanyActionOrderService],
    }).compile();

    service = module.get<CompanyActionOrderService>(CompanyActionOrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
