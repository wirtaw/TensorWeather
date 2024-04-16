import { Module } from '@nestjs/common';
import { OpenweatherService } from './openweather.service';

@Module({
  providers: [OpenweatherService],
  exports: [OpenweatherService],
})
export class OpenweatherModule {}
