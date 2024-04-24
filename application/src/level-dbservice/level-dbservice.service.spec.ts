import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { LevelDbService } from './level-dbservice.service';

async function createNestApp(...gateways: any): Promise<INestApplication> {
  const testingModule = await Test.createTestingModule({
    providers: gateways,
  }).compile();
  return testingModule.createNestApplication();
}

describe('LevelDbserviceService', () => {
  let app: INestApplication;
  let service: LevelDbService;

  beforeAll(async () => {
    app = await createNestApp(
      ConfigService,
      LevelDbService,
    );
    service = app.get<LevelDbService>(LevelDbService);

    app.listen(3000);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
