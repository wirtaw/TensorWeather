import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LevelDbService } from './level-dbservice.service';

describe('LevelDbserviceService', () => {
  let service: LevelDbService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LevelDbService, ConfigService],
    }).compile();

    service = module.get<LevelDbService>(LevelDbService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should be defined configService', () => {
    expect(configService).toBeDefined();
  });
});
