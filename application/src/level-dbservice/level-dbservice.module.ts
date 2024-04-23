import { Module } from '@nestjs/common';
import { LevelDbService } from './level-dbservice.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [LevelDbService],
  exports: [LevelDbService],
})
export class LevelDbModule {}
