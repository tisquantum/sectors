import { Test, TestingModule } from '@nestjs/testing';
import { OptionContractService } from './option-contract.service';

describe('OptionContractService', () => {
  let service: OptionContractService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OptionContractService],
    }).compile();

    service = module.get<OptionContractService>(OptionContractService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
