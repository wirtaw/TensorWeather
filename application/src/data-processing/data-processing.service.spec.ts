import { Test, TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker';
import { DataProcessingService } from './data-processing.service';
import { LevelDbService } from '../level-dbservice/level-dbservice.service';
import { WeatherData } from '../openweather/interfaces/openweather.interfaces';
import { ProcessingOptions } from './interfaces/data-processing.interfaces';

describe('DataProcessingService', () => {
  let service: DataProcessingService;
  let levelDbService: LevelDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DataProcessingService, LevelDbService],
    }).compile();

    service = module.get<DataProcessingService>(DataProcessingService);
    levelDbService = module.get<LevelDbService>(LevelDbService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should be defined levelDbService', () => {
    expect(levelDbService).toBeDefined();
  });

  describe('cleanAndProcess', () => {
    let weatherData: WeatherData[] = [];
    let size: number = 10;
    let options: ProcessingOptions;
    beforeEach(() => {
      size = faker.number.float({ min: 1, max: 10 });
      weatherData = Array.from({ length: size } , () => ({
        id: faker.string.uuid(),
        lat: faker.number.int({ min: -180, max: 180 }),
        lon: faker.number.int({ min: -180, max: 180 }),
        tz: faker.number.float({ min: -12, max: 12 }).toString(),
        date: faker.date.past().toISOString(),
        units: faker.helpers.arrayElement(['metric', 'any']),
        cloud_cover: {
          afternoon: faker.number.float({ min: 0, max: 100 })
        },
        humidity: {
          afternoon: faker.number.float({ min: 20, max: 80 })
        },
        precipitation: {
          total: faker.number.float({ min: 20, max: 80 })
        },
        pressure: {
          afternoon: faker.number.float({ min: 100, max: 1500 })
        },
        temperature: {
          min: faker.number.float({ min: -20, max: 80 }),
          max: faker.number.float({ min: -20, max: 80 }),
          afternoon: faker.number.float({ min: -20, max: 80 }),
          night: faker.number.float({ min: -20, max: 80 }),
          evening: faker.number.float({ min: -20, max: 80 }),
          morning: faker.number.float({ min: -20, max: 80 }),
        },
        wind: {
          max: {
            speed: faker.number.float({ min: 0, max: 15 }),
            direction: faker.number.float({ min: -180, max: 180 }),
          }
        }
      }));
      options = {
        startDate: faker.date.past(),
        endDate: faker.date.past(),
        lat: faker.number.int({ min: -180, max: 180 }),
        lon: faker.number.int({ min: -180, max: 180 }),
      };
    });

    it('should cleanAndProcess existing weatherData', async () => {
      jest.spyOn(levelDbService, 'getDataByRange').mockResolvedValueOnce(weatherData);

      const res = await service.cleanAndProcess(options);

      expect(res).toHaveLength(size);
    });
  });
});
