import { Test, TestingModule } from '@nestjs/testing';
import { CompanyActionService } from './company-action.service';

describe('CompanyActionService', () => {
  let service: CompanyActionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompanyActionService],
    }).compile();

    service = module.get<CompanyActionService>(CompanyActionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
