import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { OpenweatherModule } from '../openweather/openweather.module';
import { DataProcessingModule } from '../data-processing/data-processing.module';

@Module({
  imports: [OpenweatherModule, DataProcessingModule],
  providers: [EventsGateway],
})
export class EventsModule {}
