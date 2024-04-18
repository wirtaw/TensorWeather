import { Injectable, Logger } from '@nestjs/common';
import * as level from 'leveldb';
import { AppConfig } from '../config/app/app.config';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LevelDbserviceService {
  private appConfig: AppConfig;
  private readonly logger = new Logger(LevelDbserviceService.name);
  private db: level = null;

  constructor(private configService: ConfigService) {
    this.appConfig = this.configService.get<AppConfig>('app');
    this.db = level(this.appConfig.dbPath);
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
      console.error('Error retrieving data:', error); 
      // Consider how to handle missing keys (e.g., return null)
      throw error;
    }
  }

  async getForecastResult(key: string): Promise<any> {
    const existingData = await this.get(key);

    if (existingData) {
      return existingData;  // Return from LevelDB
    } else {
      // Need to fetch/generate a new forecast (replace placeholder)
      const newForecastResult = await this.generateForecast(); 
      await this.put(key, newForecastResult); 
      return newForecastResult;
    }
  }

  // placeholder - replace with actual forecast generation logic
  private async generateForecast() {
    // ... your logic to fetch or calculate a forecast result
    return { /* ... forecast result */ }; 
  }
}
