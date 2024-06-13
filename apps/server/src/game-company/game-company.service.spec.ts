import { Test, TestingModule } from '@nestjs/testing';
import { GameCompanyService } from './game-company.service';

describe('GameCompanyService', () => {
  let service: GameCompanyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameCompanyService],
    }).compile();

    service = module.get<GameCompanyService>(GameCompanyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
