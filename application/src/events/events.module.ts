import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { OpenweatherModule } from 'src/openweather/openweather.module';

@Module({
  imports: [OpenweatherModule],
  providers: [EventsGateway],
})
export class EventsModule {}
