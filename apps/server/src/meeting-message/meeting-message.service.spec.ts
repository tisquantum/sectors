import { Test, TestingModule } from '@nestjs/testing';
import { MeetingMessageService } from './meeting-message.service';

describe('MeetingMessageService', () => {
  let service: MeetingMessageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MeetingMessageService],
    }).compile();

    service = module.get<MeetingMessageService>(MeetingMessageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
