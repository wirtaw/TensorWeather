import { IoAdapter } from '@nestjs/platform-socket.io';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from './../config/app/app.config';
import { Logger } from '@nestjs/common';

export class SocketIoAdapter extends IoAdapter {
  private readonly logger = new Logger(SocketIoAdapter.name);

  constructor(private readonly configService: ConfigService) {
    super();
  }

  createIOServer() {
    const { socket } = this.configService.get<AppConfig>('app');
    this.logger.debug(` createIOServer on ${socket.port}`);
    return super.createIOServer(socket.port);
  }
}
