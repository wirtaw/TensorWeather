import { Module } from '@nestjs/common';
import { LevelDbService } from './level-dbservice.service';

@Module({
  providers: [LevelDbService],
  exports: [LevelDbService],
})
export class LevelDbModule {}
