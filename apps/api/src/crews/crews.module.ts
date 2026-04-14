import { Module } from '@nestjs/common';
import { CrewsController } from './crews.controller';
import { CrewsService } from './crews.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [CrewsController],
  providers: [CrewsService],
  exports: [CrewsService],
})
export class CrewsModule {}
