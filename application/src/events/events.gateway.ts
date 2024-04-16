import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Server } from 'socket.io';

@WebSocketGateway({})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer() io: Server;

  afterInit() {
    this.logger.log('Initialized');
  }

  handleConnection(client: any) {
    const { sockets } = this.io.sockets;

    this.logger.log(`Client id: ${client.id} connected`);
    this.logger.debug(`Number of connected clients: ${sockets.size}`);
  }

  handleDisconnect(client: any) {
    this.logger.log(`Cliend id:${client.id} disconnected`);
  }

  @SubscribeMessage('ping')
  handlePing(client: any, data: any) {
    this.logger.log(`Message received from client id: ${client.id}`);
    this.logger.debug(`Payload: ${data}`);
    return {
      event: 'pong',
      data: 'Hello world!',
    };
  }

  @SubscribeMessage('forecast_request')
  handleForecastRequest(client: Server, payload: any): void {
    this.logger.log(`Forecast `, payload);
    client.emit('done', 'Hello from NestJS!');
  }
}
