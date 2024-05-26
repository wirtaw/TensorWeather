import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as R from 'ramda';
import { DateTime, Settings } from 'luxon';
import { LevelDbService } from '../level-dbservice/level-dbservice.service';
import { ProcessingOptions } from './interfaces/data-processing.interfaces';
import { AppConfig } from '../config/app/app.config';
import {
  WeatherData,
  WeatherDataNormalized,
} from '../openweather/interfaces/openweather.interfaces';
import { TrainArguments } from './interfaces/train-arguments.interfaces';

@Injectable()
export class DataProcessingService {
  private appConfig: AppConfig;
  private trainArguments: TrainArguments;
  private readonly logger = new Logger(DataProcessingService.name);

  constructor(
    private configService: ConfigService,
    private readonly levelDBService: LevelDbService,
  ) {
    this.appConfig = this.configService.get<AppConfig>('app');
    this.trainArguments = {
      modelType: null,
      gpu: false,
      lookBack: 10 * 24 * 6,
      step: 6,
      delay: 144,
      normalize: true,
      includeDateTime: false,
      batchSize: 128,
      epochs: 20,
      earlyStoppingPatience: 2,
      logDir: '',
      logUpdateFreq: null,
    };
  }

  async cleanAndProcess(
    options: ProcessingOptions,
  ): Promise<WeatherDataNormalized[]> {
    const { timeZone, syncHour } = this.appConfig;
    const { startDate, endDate, lat: latitude, lon: longitude } = options;
    const rawData: WeatherData[] = [];

    Settings.defaultZone = timeZone;

    const dtStart = DateTime.fromMillis(startDate).set({ hour: syncHour });
    if (!startDate || !dtStart.isValid) {
      throw new Error(`Invalid start date. ${dtStart.invalidExplanation}`);
    }

    const dtEnd = DateTime.fromMillis(endDate).set({ hour: syncHour });
    if (!endDate || !dtEnd.isValid) {
      throw new Error(`Invalid end date. ${dtEnd.invalidExplanation}`);
    }

    const { days } =
      startDate < endDate
        ? dtEnd.diff(dtStart, 'days').toObject()
        : dtStart.diff(dtEnd, 'days').toObject();

    Settings.defaultZone = null;

    for (let i = 0; i < days; i++) {
      const dt =
        startDate < endDate
          ? dtStart.plus({ days: i })
          : dtEnd.plus({ days: i });
      const key: string = `day-summary-${latitude}-${longitude}-${dt.toMillis()}`;
      const cachedData: WeatherData | undefined =
        await this.levelDBService.get(key);
      if (cachedData) {
        rawData.push(cachedData);
      }
    }

    this.logger.log(` rawData ${rawData.length}`);

    const remap = R.curry((desc, obj) =>
      R.map((path) => R.view(R.lensPath(path), obj), desc),
    );

    const checkTemperature = R.pipe(
      R.prop('temperature'),
      R.where({
        max: R.is(Number),
        min: R.is(Number),
        morning: R.is(Number),
        afternoon: R.is(Number),
        evening: R.is(Number),
        night: R.is(Number),
      }),
    );

    const filterByTemperature = R.filter(checkTemperature);

    const checkHumidity = R.pipe(
      R.prop('humidity'),
      R.where({
        afternoon: R.is(Number),
      }),
    );

    const filterByHumidity = R.filter(checkHumidity);

    const checkPressure = R.pipe(
      R.prop('pressure'),
      R.where({
        afternoon: R.is(Number),
      }),
    );

    const filterByPressure = R.filter(checkPressure);

    const checkPrecipitation = R.pipe(
      R.prop('precipitation'),
      R.where({
        total: R.is(Number),
      }),
    );

    const filterByPrecipitation = R.filter(checkPrecipitation);

    const checkCloudCover = R.pipe(
      R.prop('cloud_cover'),
      R.where({
        afternoon: R.is(Number),
      }),
    );

    const filterByCloudCover = R.filter(checkCloudCover);

    const myExtract = remap({
      temperature_min: ['temperature', 'min'],
      temperature_max: ['temperature', 'max'],
      temperature_1: ['temperature', 'morning'],
      temperature_2: ['temperature', 'afternoon'],
      temperature_3: ['temperature', 'evening'],
      temperature_4: ['temperature', 'night'],
      humidity: ['humidity', 'afternoon'],
      pressure: ['pressure', 'afternoon'],
      precipitation: ['precipitation', 'total'],
      wind: ['wind', 'max', 'speed'],
      cloud_cover: ['cloud_cover', 'afternoon'],
      date: ['date'],
      id: ['id'],
    });

    const processedData: WeatherDataNormalized[] | any = R.map(
      myExtract,
      R.pipe(
        filterByTemperature,
        filterByHumidity,
        filterByPressure,
        filterByPrecipitation,
        filterByCloudCover,
      )(rawData),
    );

    return processedData;
  }

  async createModel(train: TrainArguments): Promise<any> {
    this.logger.log(` train model ${train.modelType}`);
    this.trainArguments = {...train};


    return true;
  }
}
