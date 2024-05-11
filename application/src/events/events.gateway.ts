import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { OpenweatherService } from '../openweather/openweather.service';
import {
  Coordinates,
  WeatherData,
} from '../openweather/interfaces/openweather.interfaces';
import { DataProcessingService } from '../data-processing/data-processing.service';

@WebSocketGateway({})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(EventsGateway.name);

  constructor(
    private readonly openweatherService: OpenweatherService,
    private readonly dataProcessingService: DataProcessingService,
  ) {}

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
    // this.logger.log(`Forecast `, payload);
    const { latitude, longitude, startDate, endDate } = payload;
    const coordinates: Coordinates = { latitude, longitude };
    const data: WeatherData[] = await this.openweatherService.getHistoricalData(
      coordinates,
      startDate,
      endDate,
    );

    client.emit('forecast_request_done', data);
  }

  @SubscribeMessage('forecast_remove_request')
  async handleForecastRemoveRequest(
    client: Server,
    payload: any,
  ): Promise<void> {
    try {
      // this.logger.log(`Forecast `, payload);
      const { latitude, longitude, startDate, endDate } = payload;
      const coordinates: Coordinates = { latitude, longitude };
      const reponse: boolean =
        await this.openweatherService.deleteHistoricalData(
          coordinates,
          startDate,
          endDate,
        );

      client.emit('forecast_request_remove_done', reponse);
    } catch (e) {
      this.logger.error(`Forecast remove error `, e?.message.toString() || '');
      client.emit('forecast_remove_failed', {
        message: e?.message.toString() || '',
      });
    }
  }

  @SubscribeMessage('forecast_summary_request')
  async handleForecastSummaryRequest(
    client: Server,
    payload: any,
  ): Promise<void> {
    try {
      // this.logger.log(`Forecast summary`, payload);
      const { latitude, longitude, startDate, endDate } = payload;
      const coordinates: Coordinates = { latitude, longitude };
      const reponse: boolean =
        await this.openweatherService.getAllHistoricalData(
          coordinates,
          startDate,
          endDate,
        );

      client.emit('forecast_summary_request_done', reponse);
    } catch (e) {
      this.logger.error(`Forecast summary error `, e?.message.toString() || '');
      client.emit('forecast_summary_request_failed', {
        message: e?.message.toString() || '',
      });
    }
  }

  @SubscribeMessage('forecast_processing_data_request')
  async handleForecastProcessingRequest(
    client: Server,
    payload: any,
  ): Promise<void> {
    // this.logger.log(`Forecast data processing`, payload);
    try {
      const { latitude, longitude, startDate, endDate } = payload;
      const reponse: boolean = await this.dataProcessingService.cleanAndProcess(
        {
          lat: latitude,
          lon: longitude,
          startDate,
          endDate,
        },
      );
      client.emit('forecast_processing_data_request_done', reponse);
    } catch (e) {
      this.logger.error(`Forecast summary error `, e?.message.toString() || '');
      client.emit('forecast_processing_data_request_failed', {
        message: e?.message.toString() || '',
      });
    }
  }
}
