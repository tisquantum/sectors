import { Test, TestingModule } from '@nestjs/testing';
import { ExecutiveGameManagementService } from './executive-game-management.service';

describe('ExecutiveGameManagementService', () => {
  let service: ExecutiveGameManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExecutiveGameManagementService],
    }).compile();

    service = module.get<ExecutiveGameManagementService>(ExecutiveGameManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
