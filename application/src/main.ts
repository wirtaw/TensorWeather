import { NestApplication, NestFactory } from '@nestjs/core';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { SocketIoAdapter } from './adaptors/socket.io.adaptor';

import helmet from 'helmet';
import * as morgan from 'morgan';
import * as express from 'express';
import { NextFunction, Request, Response } from 'express';

import { AppConfig } from './config/app/app.config';
import { AppModule } from './app.module';


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  /**
   * @description Configuration
   */
  const configService: ConfigService = app.get(ConfigService);
  const appConfig = configService.get<AppConfig>('app');

  /**
   * @description Security
   */
  // app.enableCors();
  app.enableCors({
    origin: appConfig.enabledOrigins[0],
    credentials: true,
    // methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
    // allowedHeaders: ['Content-Type', 'Authorization'],
    // optionsSuccessStatus: 200,
  });
  app.use(helmet());

  /**
   * @description Logging
   */
  app.use(
    morgan('tiny', {
      stream: {
        write: (message) => Logger.log(message.trim()),
      },
    }),
  );

  /**
   * @description Global
   */
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));
  app.use(express.json({ limit: '5mb' }));

  /**
   * @description Req & Res timeouts
   */
  app.use((request: Request, response: Response, next: NextFunction) => {
    request.setTimeout(appConfig.requestTimeoutSeconds, () => {
      throw new HttpException('Server Timeout', HttpStatus.REQUEST_TIMEOUT);
    });

    response.setTimeout(appConfig.responseTimeoutSeconds);

    next();
  });

  if (process.env.NODE_ENV !== 'test') {
    /**
     * @description WebSocket server
     */
    app.useWebSocketAdapter(new SocketIoAdapter(configService));

    await app.listen(appConfig.port, () =>
      Logger.log(`Service run on port: ${appConfig.port}`),
    );
  }
}
bootstrap()
  .then(() => {
    Logger.log(`Bootstrap started successfully ${NestApplication.name}`);
  })
  .catch((e) => {
    Logger.error(e.stack, NestApplication.name);
  });
