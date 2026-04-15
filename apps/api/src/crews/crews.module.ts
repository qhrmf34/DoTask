import { Module, forwardRef } from '@nestjs/common';
import { CrewsController } from './crews.controller';
import { CrewsService } from './crews.service';
import { UploadModule } from '../upload/upload.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [UploadModule, forwardRef(() => ChatModule)],
  controllers: [CrewsController],
  providers: [CrewsService],
  exports: [CrewsService],
})
export class CrewsModule {}
