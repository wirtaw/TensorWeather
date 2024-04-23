import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig, { getEnvFilePaths } from './config/config';
import { EventsModule } from './events/events.module';
import { OpenweatherModule } from './openweather/openweather.module';
import { LevelDbModule } from './level-dbservice/level-dbservice.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: getEnvFilePaths(),
      cache: true,
    }),
    LevelDbModule,
    EventsModule,
    OpenweatherModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
