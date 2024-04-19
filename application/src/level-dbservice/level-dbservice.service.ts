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
      /*await this.db.close(() => {
        this.logger.log(`Db is closed`);
      });*/
    } catch (error) {
      console.error('Error storing data:', error);
      throw error; // Re-throw to propagate the error
    }
  }

  async get(key: string): Promise<any> {
    try {
      const data = await this.db.get(key);
      /*await this.db.close(() => {
        this.logger.log(`Db is closed`);
      });*/
      return JSON.parse(data);
    } catch (error) {
      console.error('Error retrieving data:', error);
      if (error?.message.includes('Key not found in database')) {
        return null;
      }
      // Consider how to handle missing keys (e.g., return null)
      throw error;
    }
  }

  close() {
    this.logger.log(`Db is closed`);
    return Promise.resolve();
  }
}
