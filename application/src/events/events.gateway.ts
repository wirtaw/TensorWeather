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
import { Server } from 'socket.io';
import { OpenweatherService } from '../openweather/openweather.service';
import { Coordinates, WeatherData } from '../openweather/interfaces/openweather.interfaces';

@WebSocketGateway({})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(EventsGateway.name);
  private openweatherService: OpenweatherService;
  constructor(openweatherService: OpenweatherService) {
    this.openweatherService = openweatherService;
  }

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
  async handleForecastRequest(client: Server, payload: any): Promise<void> {
    this.logger.log(`Forecast `, payload);
    const { latitude, longitude, startDate, endDate } = payload;
    const coordinates: Coordinates = { latitude, longitude };
    const data: WeatherData[] = await this.openweatherService.getHistoricalData(coordinates, startDate, endDate);

    client.emit('done', data);
  }
}
