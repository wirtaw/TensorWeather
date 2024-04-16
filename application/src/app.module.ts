import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig, { getEnvFilePaths } from './config/config';
import { EventsModule } from './events/events.module';
import { OpenweatherService } from './openweather/openweather.service';
import { OpenweatherModule } from './openweather/openweather.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: getEnvFilePaths(),
      cache: true,
    }),
    EventsModule,
    OpenweatherModule,
  ],
  controllers: [AppController],
  providers: [AppService, OpenweatherService],
})
export class AppModule {}
