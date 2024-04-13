import { IoAdapter } from '@nestjs/platform-socket.io';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from './../config/app/app.config';
import { Logger } from '@nestjs/common';

export class SocketIoAdapter extends IoAdapter {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  createIOServer() {
    const appConfig = this.configService.get<AppConfig>('app');
    Logger.log(` createIOServer on ${appConfig.socketPort}`);
    return super.createIOServer(appConfig.socketPort);
  }
}
