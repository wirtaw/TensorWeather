import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventsGateway } from './events.gateway';
import { INestApplication } from '@nestjs/common';
import { Socket, io } from 'socket.io-client';
import { OpenweatherService } from '../openweather/openweather.service';

jest.setTimeout(10000);

async function createNestApp(...gateways: any): Promise<INestApplication> {
  const testingModule = await Test.createTestingModule({
    providers: gateways,
  }).compile();
  return testingModule.createNestApplication();
}

describe('EventsGateway', () => {
  let gateway: EventsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventsGateway, ConfigService, OpenweatherService],
    }).compile();

    gateway = module.get<EventsGateway>(EventsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('check with client', () => {
    let app: INestApplication;
    let ioClient: Socket;

    beforeAll(async () => {
      // Instantiate the app
      app = await createNestApp(
        EventsGateway,
        ConfigService,
        OpenweatherService,
      );
      // Get the gateway instance from the app instance
      gateway = app.get<EventsGateway>(EventsGateway);
      // Create a new client that will interact with the gateway
      ioClient = io('http://localhost:3000', {
        autoConnect: false,
        transports: ['websocket', 'polling'],
      });

      app.listen(3000);
    });

    afterAll(async () => {
      await app.close();
    });

    it('should be defined', () => {
      expect(gateway).toBeDefined();
    });

    it('should emit "pong" on "ping"', async (done) => {
      ioClient.connect();
      ioClient.emit('ping', 'Hello world!');
      await new Promise<void>((resolve) => {
        ioClient.on('connect', () => {
          console.log('connected');
        });
        ioClient.on('pong', (data) => {
          expect(data).toBe('Hello world!');
          resolve();
        });
      });
      ioClient.disconnect();
      await new Promise<void>((resolve) => {
        ioClient.on('disconnect', () => {
          console.log('client disconnected');
          resolve();
        });
      });
      done();
    });
  });
});
