import { Test, TestingModule } from '@nestjs/testing';
import { ExecutivePlayerService } from './executive-player.service';

describe('ExecutivePlayerService', () => {
  let service: ExecutivePlayerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExecutivePlayerService],
    }).compile();

    service = module.get<ExecutivePlayerService>(ExecutivePlayerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
