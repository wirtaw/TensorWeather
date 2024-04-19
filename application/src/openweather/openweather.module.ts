import { Module } from '@nestjs/common';
import { OpenweatherService } from './openweather.service';
import { LevelDbModule } from '../level-dbservice/level-dbservice.module';

@Module({
  imports: [LevelDbModule],
  providers: [OpenweatherService],
  exports: [OpenweatherService],
})
export class OpenweatherModule {}
