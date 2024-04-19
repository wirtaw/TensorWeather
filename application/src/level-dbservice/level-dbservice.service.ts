import { Injectable, Logger } from '@nestjs/common';
import * as levelup from 'levelup';
import * as leveldown from 'leveldown';
import { AppConfig } from '../config/app/app.config';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LevelDbService {
  private appConfig: AppConfig;
  private readonly logger = new Logger(LevelDbService.name);
  private db = null;

  constructor(private configService: ConfigService) {
    this.appConfig = this.configService.get<AppConfig>('app');
    this.db = levelup(leveldown(this.appConfig.db.path));

    if (!this.db.supports.permanence) {
      throw new Error('Persistent storage is required');
    }
  }

  async put(key: string, value: any): Promise<void> {
    try {
      await this.db.put(key, JSON.stringify(value));
      await this.db.close(this.close());
    } catch (error) {
      console.error('Error storing data:', error);
      throw error; // Re-throw to propagate the error
    }
  }

  async get(key: string): Promise<any> {
    try {
      const data = await this.db.get(key);
      await this.db.close();
      return JSON.parse(data);
    } catch (error) {
      console.error('Error retrieving data:', error);
      // Consider how to handle missing keys (e.g., return null)
      throw error;
    }
  }

  async getForecastResult(key: string): Promise<any> {
    const existingData = await this.get(key);
    await this.db.close();

    if (existingData) {
      return existingData; // Return from LevelDB
    } else {
      // Need to fetch/generate a new forecast (replace placeholder)
      const newForecastResult = await this.generateForecast();
      await this.put(key, newForecastResult);
      await this.db.close();
      return newForecastResult;
    }
  }

  // placeholder - replace with actual forecast generation logic
  private async generateForecast() {
    // ... your logic to fetch or calculate a forecast result
    return {
      /* ... forecast result */
    };
  }

  close() {
    this.logger.log(`Db is closed`);
    return Promise.resolve();
  }
}
