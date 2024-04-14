import { Test, TestingModule } from '@nestjs/testing';
import { EventsGateway } from './events.gateway';
import { INestApplication } from '@nestjs/common';
import { Socket, io } from 'socket.io-client';

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
      providers: [EventsGateway],
    }).compile();

    gateway = module.get<EventsGateway>(EventsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleMessage', () => {
    it('should be handleMessage', () => {
      expect(gateway.handleMessage()).toStrictEqual([{ id: 1, value: 2 }]);
    });
  });

  describe('check with client', () => {
    let app: INestApplication;
    let ioClient: Socket;

    beforeAll(async () => {
      // Instantiate the app
      app = await createNestApp(EventsGateway);
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
      ioClient.on('disconnect', () => {
        console.log('client disconnected');
        done();
      });
    }, 15000);
  });
});
