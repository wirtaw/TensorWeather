import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import * as fs from 'fs';
import * as path from 'node:path';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHello', () => {
    it('should return "Hello Tensor Weather World!"', () => {
      const result = service.getHello();
      expect(result).toBe('Hello Stock Tensor Weather World!');
    });
  });
});
