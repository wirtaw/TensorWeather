import { randomUUID } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { request } from 'undici';
import { DateTime, Settings } from 'luxon';
import { AppConfig } from '../config/app/app.config';
import { Coordinates, WeatherData } from './interfaces/openweather.interfaces';
import { LevelDbService } from '../level-dbservice/level-dbservice.service';

@Injectable()
export class OpenweatherService {
  private appConfig: AppConfig;
  private readonly logger = new Logger(OpenweatherService.name);

  constructor(
    private configService: ConfigService,
    private readonly levelDBService: LevelDbService,
  ) {
    this.appConfig = this.configService.get<AppConfig>('app');
  }

  async getInRangeByCoordinatesData({
    appId,
    latitude,
    longitude,
    days,
    dtStart,
    dtEnd,
    startDate,
    endDate,
    openweather,
  }) {
    const result: WeatherData[] = [];

    for (let i = 0; i < days; i++) {
      const dt =
        startDate < endDate
          ? dtStart.plus({ days: i })
          : dtEnd.plus({ days: i });
      const key: string = `day-summary-${latitude}-${longitude}-${dt.toMillis()}`;
      const cachedData: WeatherData | undefined =
        await this.levelDBService.get(key);
      if (cachedData) {
        result.push(cachedData);
        // this.logger.log(`return from cache ${key}`);
      }

      if (openweather) {
        const url: string = `https://api.openweathermap.org/data/3.0/onecall/day_summary?lat=${latitude}&lon=${longitude}&date=${dt.toFormat('yyyy-LL-dd')}&appid=${appId}&units=metric`;
        this.logger.log(` start getHistoricalData ${url}`);

        const { statusCode, body } = await request(url);

        // this.logger.log(` statusCode ${statusCode}`);

        if (statusCode === 200) {
          for await (const data of body) {
            // this.logger.log('data', data);
            result.push({ id: randomUUID(), ...JSON.parse(data) });
            await this.levelDBService.put(key, {
              id: randomUUID(),
              ...JSON.parse(data),
            });
          }
        }
      }
    }
    return result;
  }

  async getHistoricalData(
    coordinates?: Coordinates,
    startDate?: number,
    endDate?: number,
  ): Promise<WeatherData | any> {
    const { openweatherApiKey: appId, timeZone, syncHour } = this.appConfig;
    if (!appId) {
      throw new Error('Missing Openweather API Key in the .env');
    }

    const { latitude, longitude } = coordinates;
    if (!coordinates || !latitude || !longitude) {
      throw new Error('Invalid coordinates');
    }

    Settings.defaultZone = timeZone;

    const dtStart = DateTime.fromMillis(startDate).set({ hour: syncHour });
    if (!startDate || !dtStart.isValid) {
      throw new Error(`Invalid start date. ${dtStart.invalidExplanation}`);
    }

    const dtEnd = DateTime.fromMillis(endDate).set({ hour: syncHour });
    if (!endDate || !dtEnd.isValid) {
      throw new Error(`Invalid end date. ${dtEnd.invalidExplanation}`);
    }

    const diff =
      startDate < endDate
        ? dtEnd.diff(dtStart, 'days').toObject()
        : dtStart.diff(dtEnd, 'days').toObject();

    Settings.defaultZone = null;

    return this.getInRangeByCoordinatesData({
      appId,
      latitude,
      longitude,
      days: diff.days,
      dtStart,
      dtEnd,
      startDate,
      endDate,
      openweather: true,
    });
  }

  async deleteHistoricalData(
    coordinates?: Coordinates,
    startDate?: number,
    endDate?: number,
  ): Promise<boolean | any> {
    const { latitude, longitude } = coordinates;
    if (!coordinates || !latitude || !longitude) {
      throw new Error('Invalid coordinates');
    }

    Settings.defaultZone = this.appConfig.timeZone;

    const dtStart = DateTime.fromMillis(startDate).set({
      hour: this.appConfig.syncHour,
    });
    if (!startDate || !dtStart.isValid) {
      throw new Error(`Invalid start date. ${dtStart.invalidExplanation}`);
    }

    const dtEnd = DateTime.fromMillis(endDate).set({
      hour: this.appConfig.syncHour,
    });
    if (!endDate || !dtEnd.isValid) {
      throw new Error(`Invalid end date. ${dtEnd.invalidExplanation}`);
    }

    const diff =
      startDate < endDate
        ? dtEnd.diff(dtStart, 'days').toObject()
        : dtStart.diff(dtEnd, 'days').toObject();

    Settings.defaultZone = null;

    for (let i = 0; i < diff.days; i++) {
      const dt =
        startDate < endDate
          ? dtStart.plus({ days: i })
          : dtEnd.plus({ days: i });
      const key: string = `day-summary-${latitude}-${longitude}-${dt.toMillis()}`;
      const cachedData: WeatherData | undefined =
        await this.levelDBService.get(key);
      if (cachedData) {
        this.logger.log(`del ${key}`);
        await this.levelDBService.del(key);
      }
    }
  }

  async getAllHistoricalData(
    coordinates?: Coordinates,
    startDate?: number,
    endDate?: number,
  ): Promise<WeatherData | any> {
    const { openweatherApiKey: appId, timeZone, syncHour } = this.appConfig;
    if (!appId) {
      throw new Error('Missing Openweather API Key in the .env');
    }

    const { latitude, longitude } = coordinates;
    if (!coordinates || !latitude || !longitude) {
      throw new Error('Invalid coordinates');
    }

    Settings.defaultZone = timeZone;

    const dtStart = DateTime.fromMillis(startDate).set({ hour: syncHour });
    if (!startDate || !dtStart.isValid) {
      throw new Error(`Invalid start date. ${dtStart.invalidExplanation}`);
    }

    const dtEnd = DateTime.fromMillis(endDate).set({ hour: syncHour });
    if (!endDate || !dtEnd.isValid) {
      throw new Error(`Invalid end date. ${dtEnd.invalidExplanation}`);
    }

    //console.dir(dtStart, { depth: 3 });
    //console.dir(dtEnd, { depth: 3 });

    const diff =
      startDate < endDate
        ? dtEnd.diff(dtStart, 'days').toObject()
        : dtStart.diff(dtEnd, 'days').toObject();

    Settings.defaultZone = null;

    return this.getInRangeByCoordinatesData({
      appId,
      latitude,
      longitude,
      days: diff.days,
      dtStart,
      dtEnd,
      startDate,
      endDate,
      openweather: false,
    });
  }
}
