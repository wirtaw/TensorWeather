import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { OpenweatherService } from '../openweather/openweather.service';

@Module({
  providers: [EventsGateway, OpenweatherService],
})
export class EventsModule {}
