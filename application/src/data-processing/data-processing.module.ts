import { Module } from '@nestjs/common';
import { LevelDbModule } from '../level-dbservice/level-dbservice.module';
import { DataProcessingService } from './data-processing.service';

@Module({
  imports: [LevelDbModule],
  providers: [DataProcessingService],
  exports: [DataProcessingService],
})
export class DataProcessingModule {}
