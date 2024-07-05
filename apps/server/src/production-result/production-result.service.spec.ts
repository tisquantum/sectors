import { Test, TestingModule } from '@nestjs/testing';
import { ProductionResultService } from './production-result.service';

describe('ProductionResultService', () => {
  let service: ProductionResultService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductionResultService],
    }).compile();

    service = module.get<ProductionResultService>(ProductionResultService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
