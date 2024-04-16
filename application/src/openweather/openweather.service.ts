import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { request } from 'undici';
import { DateTime } from 'luxon';
import { AppConfig } from '../config/app/app.config';
import { Coordinates, WeatherData } from './interfaces/openweather.interfaces';

@Injectable()
export class OpenweatherService {
  private appConfig: AppConfig;

  constructor(private configService: ConfigService) {
    this.appConfig = this.configService.get<AppConfig>('app');
  }

  async getHistoricalData(
    coordinates: Coordinates,
    startDate: number,
    endDate: number,
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

    const { statusCode, body } = await request(
      `https://api.openweathermap.org/data/3.0/onecall/day_summary?lat=${latitude}&lon=${longitude}&date=${dtStart.toFormat('yyyy-LL-dd')}&appid=${appId}`,
    );

    if (statusCode === 200) {
      for await (const data of body) {
        console.log('data', data);
        result.push(data);
      }
      return result;
    }

    return null;
  }
}
