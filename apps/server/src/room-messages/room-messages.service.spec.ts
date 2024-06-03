import { Test, TestingModule } from '@nestjs/testing';
import { RoomMessagesService } from './room-messages.service';

describe('RoomMessagesService', () => {
  let service: RoomMessagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomMessagesService],
    }).compile();

    service = module.get<RoomMessagesService>(RoomMessagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
