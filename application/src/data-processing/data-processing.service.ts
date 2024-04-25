import { Injectable } from '@nestjs/common';
import * as R from 'ramda';
import { LevelDbService } from '../level-dbservice/level-dbservice.service';
import { ProcessingOptions } from './interfaces/data-processing.interfaces';

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
      R.map(
        R.pick([
          'temperature.min',
          'temperature.max',
          'humidity.afternoon',
          'pressure.afternoon',
          'wind.max.speed',
        ]),
      ),
    )(rawData);

    return processedData;
  }
}
