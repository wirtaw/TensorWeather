import { Test, TestingModule } from '@nestjs/testing';
import { LevelDbserviceService } from './level-dbservice.service';

describe('LevelDbserviceService', () => {
  let service: LevelDbserviceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LevelDbserviceService],
    }).compile();

    service = module.get<LevelDbserviceService>(LevelDbserviceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
