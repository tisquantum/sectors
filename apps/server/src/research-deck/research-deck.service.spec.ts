import { Test, TestingModule } from '@nestjs/testing';
import { ResearchDeckService } from './research-deck.service';

describe('ResearchDeckService', () => {
  let service: ResearchDeckService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResearchDeckService],
    }).compile();

    service = module.get<ResearchDeckService>(ResearchDeckService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
