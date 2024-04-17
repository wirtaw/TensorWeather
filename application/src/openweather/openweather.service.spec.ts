import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OpenweatherService } from './openweather.service';

describe('OpenweatherService', () => {
  let service: OpenweatherService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenweatherService, ConfigService],
    }).compile();

    service = module.get<OpenweatherService>(OpenweatherService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should be defined configService', () => {
    expect(configService).toBeDefined();
  });
});
