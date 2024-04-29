import { Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import * as levelup from 'levelup';
import * as leveldown from 'leveldown';
import { ConfigService } from '@nestjs/config';
import { WeatherData } from '../openweather/interfaces/openweather.interfaces';
import { DbConfig } from 'src/config/database/database.config';

@Injectable()
export class LevelDbService {
  private readonly dbConfig: DbConfig;
  private readonly logger = new Logger(LevelDbService.name);
  private db = null;

  constructor(configService: ConfigService) {
    this.dbConfig = configService.get<DbConfig>('db');
    debugger;
    console.dir(this.dbConfig, { depth: 2 });
    this.db = levelup(leveldown(this.dbConfig.path));

    if (!this.db.supports.permanence) {
      throw new Error('Persistent storage is required');
    }
  }

  async put(key: string, value: any): Promise<void> {
    try {
      await this.db.put(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error storing data:', error);
      throw error; // Re-throw to propagate the error
    }
  }

  async get(key: string): Promise<any> {
    try {
      const data = await this.db.get(key);
      return JSON.parse(data);
    } catch (error) {
      // console.error('Error retrieving data:', error);
      if (error?.message.includes('Key not found in database')) {
        return null;
      }
      // Consider how to handle missing keys (e.g., return null)
      throw error;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.db.del(key);
      return true;
    } catch (error) {
      console.error('Error retrieving data:', error);
      if (error?.message.includes('Key not found in database')) {
        return false;
      }
      throw error;
    }
  }

  async getDataByRange({ startDate, endDate, lat, lon }): Promise<any> {
    if (!lat || !lon) {
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

    const diff =
      startDate < endDate
        ? dtEnd.diff(dtStart, 'days').toObject()
        : dtStart.diff(dtEnd, 'days').toObject();

    const result: WeatherData[] = [];
    for (let i = 0; i < diff.days; i++) {
      const dt =
        startDate < endDate
          ? dtStart.plus({ days: i })
          : dtEnd.plus({ days: i });
      const key: string = `day-summary-${lat}-${lon}-${dt.toMillis()}`;
      const data: WeatherData | undefined = await this.get(key);
      if (data) {
        result.push(data);
      }
    }

    return result;
  }

  close() {
    this.logger.log(`Db is closed`);
    return Promise.resolve();
  }
}
