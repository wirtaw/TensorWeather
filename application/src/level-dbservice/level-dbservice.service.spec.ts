import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { LevelDbService } from './level-dbservice.service';

describe('LevelDbserviceService', () => {
  let service: LevelDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [LevelDbService],
    }).compile();

    service = module.get<LevelDbService>(LevelDbService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
