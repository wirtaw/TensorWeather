import { randomUUID } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { request } from 'undici';
import { DateTime } from 'luxon';
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

  async getHistoricalData(
    coordinates?: Coordinates,
    startDate?: number,
    endDate?: number,
  ): Promise<WeatherData | any> {
    const { openweatherApiKey: appId } = this.appConfig;
    if (!appId) {
      throw new Error('Missing Openweather API Key in the .env');
    }

    const { latitude, longitude } = coordinates;
    if (!coordinates || !latitude || !longitude) {
      throw new Error('Invalid coordinates');
    }

    const dtStart = DateTime.fromMillis(startDate);
    if (!startDate || !dtStart.isValid) {
      throw new Error(`Invalid start date. ${dtStart.invalidExplanation}`);
    }

    const dtEnd = DateTime.fromMillis(endDate);
    if (!endDate || !dtEnd.isValid) {
      throw new Error(`Invalid end date. ${dtEnd.invalidExplanation}`);
    }

    const result: WeatherData[] = [];
    const key: string = `day-summary-${latitude}-${longitude}-${startDate}`;
    const cachedData: WeatherData | undefined =
      await this.levelDBService.get(key);
    if (cachedData) {
      result.push(cachedData);
      this.logger.log(`return from cache ${key}`);
      return result;
    }
    const url: string = `https://api.openweathermap.org/data/3.0/onecall/day_summary?lat=${latitude}&lon=${longitude}&date=${dtStart.toFormat('yyyy-LL-dd')}&appid=${appId}&units=metric`;
    // this.logger.log(` start getHistoricalData ${url}`);

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
      return result;
    } else {
      throw new Error(`Internal error from Openweather service ${statusCode}`);
    }

    return null;
  }
}
