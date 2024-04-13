import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Server } from 'ws';
import { Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  port: 3002,
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  afterInit() {
    Logger.log(`Socket.IO server initialized`);
  }

  handleConnection(client: Socket) {
    client.emit('connected', 'Hello from NestJS!');
  }

  handleDisconnect(client: Socket) {
    Logger.log(`Disconnected %o client`, client.id);
  }

  @SubscribeMessage('new_forecast_request')
  handleForecastRequest(client: Socket, payload: any): void {
    Logger.log(`Forecast `, payload);
    client.emit('done', 'Hello from NestJS!');
  }

  @SubscribeMessage('message')
  handleMessage(): Array<{ id: number; value: number }> {
    return [{ id: 1, value: 2 }];
  }

  @SubscribeMessage('events')
  onEvent(): Observable<WsResponse<number>> {
    return from([1, 2, 3]).pipe(
      map((item) => ({ event: 'events', data: item })),
    );
  }
}
