import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OpenweatherService } from './openweather.service';
import { LevelDbService } from 'src/level-dbservice/level-dbservice.service';

describe('OpenweatherService', () => {
  let service: OpenweatherService;
  let configService: ConfigService;
  let levelDbService: LevelDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenweatherService, ConfigService, LevelDbService],
    }).compile();

    service = module.get<OpenweatherService>(OpenweatherService);
    configService = module.get<ConfigService>(ConfigService);
    levelDbService = module.get<LevelDbService>(LevelDbService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should be defined configService', () => {
    expect(configService).toBeDefined();
  });

  it('should be defined levelDbService', () => {
    expect(levelDbService).toBeDefined();
  });
});
