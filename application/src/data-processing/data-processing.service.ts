import { Injectable } from '@nestjs/common';
import * as R from 'ramda';
import { LevelDbService } from '../level-dbservice/level-dbservice.service';

interface ProcessingOptions {
  startDate: Date;
  endDate: Date;
  lat: number;
  lon: number;
  interval?: 'daily' | 'monthly';
  monthlyDays?: number[];
  months?: number[]; // Array of month numbers (1-based, so 1 = January)
}

@Injectable()
export class DataProcessingService {
  constructor(private readonly levelDBService: LevelDbService) {}

  async cleanAndProcess(options: ProcessingOptions): Promise<any> {
    const rawData = await this.levelDBService.getDataByRange({
      startDate: options.startDate,
      endDate: options.endDate,
      lat: options.lat,
      lon: options.lon,
    });

    const processedData = R.pipe(
      R.map(R.pick(['temperature', 'humidity', 'pressure', 'wind'])),
    )(rawData);

    return processedData;
  }
}
