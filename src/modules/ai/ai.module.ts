import { Module } from '@nestjs/common';
import { TtsService } from './tts.service';
import { HttpModule } from '@nestjs/axios';
import { AiController } from './ai.controller';

@Module({
  imports: [HttpModule],
  controllers: [AiController],
  providers: [TtsService],
  exports: [TtsService],
})
export class AiModule {}
